"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseAmountCents } from "@/lib/finance-rules";
import { authorizationMessage, getCurrentUserId, requireSpaceAccess } from "@/server/auth-context";
import { ensureDefaultCategories } from "@/server/categories";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MAX_ROWS = 500;
const importedRowSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().trim().min(2).max(180),
  amountCents: z.number().int().refine((value) => value !== 0),
  kind: z.enum(["income", "expense"]),
  accountId: z.string().min(1),
  categoryId: z.string().min(1),
});
const importedRowsSchema = z.object({ spaceId: z.string().min(1), rows: z.array(importedRowSchema).min(1).max(MAX_ROWS) });

export type ImportedStatementRow = z.infer<typeof importedRowSchema> & { id: string; isDuplicate: boolean; duplicateOf?: string };

function splitCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const delimiter = (text.split(/\r?\n/, 1)[0]?.match(/;/g)?.length ?? 0) > (text.split(/\r?\n/, 1)[0]?.match(/,/g)?.length ?? 0) ? ";" : ",";
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"' && text[index + 1] === '"' && quoted) { cell += '"'; index += 1; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (!quoted && character === delimiter) { row.push(cell.trim()); cell = ""; continue; }
    if (!quoted && (character === "\n" || character === "\r")) { if (character === "\r" && text[index + 1] === "\n") index += 1; row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = ""; continue; }
    cell += character;
  }
  row.push(cell.trim()); if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalizeHeader(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
function parseDate(value: string) {
  const clean = value.trim();
  const brazilian = clean.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
  if (brazilian) return `${brazilian[3]}-${brazilian[2].padStart(2, "0")}-${brazilian[1].padStart(2, "0")}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(clean) ? clean : null;
}
function parseMoney(value: string) {
  const raw = value.replace(/R\$|\s/gi, "").trim();
  if (!raw) return null;
  const negative = /^\(.*\)$/.test(raw) || raw.startsWith("-");
  const unsigned = raw.replace(/[()\-+]/g, "");
  try { return (negative ? -1 : 1) * parseAmountCents(unsigned); } catch { return null; }
}
function classify(description: string, kind: "income" | "expense", categories: Array<{ id: string; name: string; kind: string }>) {
  const text = description.toLowerCase();
  const keywords: Array<[string[], string]> = [[ ["netflix", "spotify", "prime", "disney", "deezer", "youtube"], "Assinaturas" ], [["uber", "99", "combust", "posto", "gasolina"], "Transporte"], [["ifood", "restaurante", "lanch", "burger", "pizza"], "Restaurantes"], [["mercado", "supermercado", "carrefour", "assai", "atacadao"], "Mercado"], [["farmacia", "drogaria", "hospital", "clinica"], "Saúde"], [["salario", "folha", "pagamento", "pro labore"], "Salário"], [["aluguel"], "Aluguel recebido"]];
  const match = keywords.find(([terms]) => terms.some((term) => text.includes(term)) && categories.some((category) => category.kind === kind && category.name === (keywords.find(([items]) => items === terms)?.[1] ?? "")));
  const preferred = match?.[1] ?? (kind === "income" ? "Outros recebimentos" : "Outros gastos");
  return categories.find((category) => category.kind === kind && category.name === preferred)?.id ?? categories.find((category) => category.kind === kind)?.id ?? "";
}
function fingerprint(row: Pick<ImportedStatementRow, "date" | "description" | "amountCents" | "accountId">) { return createHash("sha256").update([row.date, row.accountId, row.amountCents, row.description.trim().toLowerCase()].join("|"), "utf8").digest("hex"); }

export async function analyzeStatement(formData: FormData) {
  const spaceId = String(formData.get("spaceId") ?? "");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_FILE_SIZE) return { success: false, message: "Envie um arquivo CSV de até 2 MB.", fieldErrors: {} };
  try {
    await requireSpaceAccess(spaceId, "transactions:write");
    await ensureDefaultCategories(spaceId);
    const [accounts, categories] = await Promise.all([
      prisma.financialAccount.findMany({ where: { financialSpaceId: spaceId, archivedAt: null }, select: { id: true } }),
      prisma.category.findMany({ where: { financialSpaceId: spaceId }, select: { id: true, name: true, kind: true } }),
    ]);
    if (!accounts.length) return { success: false, message: "Cadastre uma conta antes de importar o extrato.", fieldErrors: {} };
    const rows = splitCsv((await file.text()).replace(/^\uFEFF/, ""));
    if (rows.length < 2) return { success: false, message: "O CSV precisa ter cabeçalho e ao menos um lançamento.", fieldErrors: {} };
    const headers = rows[0].map(normalizeHeader);
    const dateIndex = headers.findIndex((header) => ["data", "date", "datamovimento"].includes(header));
    const descriptionIndex = headers.findIndex((header) => ["descricao", "description", "historico", "memo"].includes(header));
    const amountIndex = headers.findIndex((header) => ["valor", "amount", "value", "quantia"].includes(header));
    const typeIndex = headers.findIndex((header) => ["tipo", "type", "natureza"].includes(header));
    if ([dateIndex, descriptionIndex, amountIndex].some((index) => index < 0)) return { success: false, message: "Não encontrei as colunas Data, Descrição e Valor no CSV.", fieldErrors: {} };
    const existing = await prisma.transaction.findMany({ where: { financialSpaceId: spaceId }, select: { importFingerprint: true, accountId: true, amountCents: true, description: true, competenceDate: true } });
    const existingFingerprints = new Set(existing.flatMap((row) => [row.importFingerprint, fingerprint({ date: row.competenceDate.toISOString().slice(0, 10), accountId: row.accountId, amountCents: row.amountCents, description: row.description })].filter((value): value is string => Boolean(value))));
    const defaultAccountId = accounts[0].id;
    const imported: ImportedStatementRow[] = rows.slice(1, MAX_ROWS + 1).flatMap((cells, index) => {
      const date = parseDate(cells[dateIndex] ?? ""); const rawAmount = parseMoney(cells[amountIndex] ?? ""); const description = (cells[descriptionIndex] ?? "").trim();
      if (!date || rawAmount === null || rawAmount === 0 || description.length < 2) return [];
      const type = (cells[typeIndex] ?? "").toLowerCase();
      const kind = /credito|credit|entrada|income|receita|deposit/.test(type) ? "income" : /debito|debit|saida|expense|despesa|pagamento/.test(type) ? "expense" : rawAmount > 0 ? "income" : "expense";
      const amountCents = kind === "expense" ? -Math.abs(rawAmount) : Math.abs(rawAmount);
      const base = { date, description, amountCents, kind: kind as "income" | "expense", accountId: defaultAccountId, categoryId: classify(description, kind as "income" | "expense", categories) };
      const importedFingerprint = fingerprint(base); return [{ ...base, id: `import-${index}-${importedFingerprint.slice(0, 8)}`, isDuplicate: existingFingerprints.has(importedFingerprint), duplicateOf: importedFingerprint }];
    });
    if (!imported.length) return { success: false, message: "Nenhum lançamento válido foi encontrado.", fieldErrors: {} };
    return { success: true, message: `${imported.length} lançamentos analisados.`, data: imported, fieldErrors: {} };
  } catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível analisar o extrato.", fieldErrors: {} }; }
}

export async function confirmImportedTransactions(input: unknown) {
  const parsed = importedRowsSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Confira os lançamentos selecionados.", fieldErrors: {} };
  try {
    await requireSpaceAccess(parsed.data.spaceId, "transactions:write");
    const userId = await getCurrentUserId();
    let created = 0; let duplicates = 0;
    await prisma.$transaction(async (tx) => {
      for (const row of parsed.data.rows) {
        const [account, category] = await Promise.all([
          tx.financialAccount.findFirst({ where: { id: row.accountId, financialSpaceId: parsed.data.spaceId, archivedAt: null }, select: { id: true } }),
          tx.category.findFirst({ where: { id: row.categoryId, financialSpaceId: parsed.data.spaceId, kind: row.kind }, select: { id: true } }),
        ]);
        if (!account || !category) continue;
        const result = await tx.transaction.createMany({ data: [{ id: randomUUID(), financialSpaceId: parsed.data.spaceId, accountId: account.id, categoryId: category.id, description: row.description, source: "statement-import", importFingerprint: fingerprint(row), amountCents: row.amountCents, kind: row.kind, status: "paid", competenceDate: new Date(`${row.date}T00:00:00Z`), paidAt: new Date(), createdBy: userId, updatedBy: userId }], skipDuplicates: true });
        if (!result.count) { duplicates += 1; continue; }
        await tx.financialAccount.update({ where: { id: account.id }, data: { balanceCents: { increment: row.amountCents }, updatedAt: new Date() } }); created += 1;
      }
    });
    revalidatePath("/"); revalidatePath("/transactions");
    return { success: true, message: `${created} lançamentos importados${duplicates ? `; ${duplicates} duplicados ignorados` : ""}.`, fieldErrors: {} };
  } catch (error) { return { success: false, message: authorizationMessage(error) ?? "Não foi possível confirmar a importação.", fieldErrors: {} }; }
}
