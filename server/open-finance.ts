import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, requireSpaceAccess } from "@/server/auth-context";
import { getAccounts, getItem, getTransactions, PluggyError, type PluggyAccount, type PluggyTransaction } from "@/server/pluggy";

function cents(value: number | undefined) {
  return Math.round((value ?? 0) * 100);
}

function signedAmount(transaction: PluggyTransaction) {
  const amount = cents(transaction.amount);
  return /debit|expense|withdrawal/i.test(transaction.type ?? "") ? -Math.abs(amount) : amount;
}

function accountType(account: PluggyAccount) {
  if (/credit/i.test(`${account.type} ${account.subtype}`)) return "credit_card";
  if (/saving/i.test(`${account.type} ${account.subtype}`)) return "savings";
  return "checking";
}

async function getAllTransactions(accountId: string) {
  const transactions: PluggyTransaction[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const result = await getTransactions(accountId, page);
    transactions.push(...(result.results ?? []));
    if ((result.results ?? []).length < 500) break;
  }
  return transactions;
}

function errorMessage(error: unknown) {
  if (!(error instanceof PluggyError)) return "Não foi possível atualizar os dados bancários.";
  return { PLUGGY_NOT_CONFIGURED: "A integração bancária ainda não foi configurada.", PLUGGY_AUTH_FAILED: "Não foi possível autenticar com o provedor bancário.", PLUGGY_AUTH_EXPIRED: "A sessão do provedor expirou. Tente atualizar novamente.", PLUGGY_RATE_LIMIT: "Limite de requisições atingido. Aguarde alguns instantes.", PLUGGY_API_ERROR: "A instituição não respondeu. Tente novamente mais tarde." }[error.message] ?? "Não foi possível atualizar os dados bancários.";
}

export async function listOpenFinance(spaceId: string) {
  await requireSpaceAccess(spaceId, "read");
  const connections = await prisma.bankConnection.findMany({ where: { financialSpaceId: spaceId }, include: { accounts: { include: { financialAccount: { select: { name: true } } } } }, orderBy: { createdAt: "asc" } });
  const transactions = await prisma.transaction.findMany({ where: { financialSpaceId: spaceId, source: "OPEN_FINANCE" }, include: { account: { select: { name: true } }, bankAccount: { include: { connection: { select: { connectorName: true } } } } }, orderBy: { competenceDate: "desc" }, take: 50 });
  return { connections: connections.map((connection) => ({ id: connection.id, name: connection.connectorName, logoUrl: connection.connectorLogoUrl, status: connection.status, lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null, errorMessage: connection.errorMessage, accounts: connection.accounts.map((account) => ({ id: account.id, name: account.name, type: account.type, subtype: account.subtype, maskedNumber: account.maskedNumber, currencyCode: account.currencyCode, currentBalanceCents: account.currentBalanceCents, availableBalanceCents: account.availableBalanceCents })) })), transactions: transactions.map((transaction) => ({ id: transaction.id, description: transaction.description, merchantName: transaction.merchantName, amountCents: transaction.amountCents, kind: transaction.kind, date: transaction.competenceDate.toISOString(), accountName: transaction.account.name, institutionName: transaction.bankAccount?.connection.connectorName ?? "Instituição" })) };
}

export async function syncOpenFinance(spaceId: string, itemId: string) {
  await requireSpaceAccess(spaceId, "accounts:write");
  const userId = await getCurrentUserId();
  try {
    const item = await getItem(itemId);
    const accountResult = await getAccounts(itemId);
    await prisma.$transaction(async (tx) => {
      const existingConnection = await tx.bankConnection.findUnique({ where: { provider_externalItemId: { provider: "pluggy", externalItemId: itemId } }, select: { userId: true, financialSpaceId: true } });
      if (existingConnection && (existingConnection.userId !== userId || existingConnection.financialSpaceId !== spaceId)) throw new Error("CONNECTION_FORBIDDEN");
      const connection = await tx.bankConnection.upsert({ where: { provider_externalItemId: { provider: "pluggy", externalItemId: itemId } }, create: { id: randomUUID(), userId, financialSpaceId: spaceId, provider: "pluggy", externalItemId: itemId, connectorName: item.connector?.name ?? "Instituição conectada", connectorLogoUrl: item.connector?.imageUrl ?? null, status: item.status ?? "ACTIVE" }, update: { userId, financialSpaceId: spaceId, connectorName: item.connector?.name ?? "Instituição conectada", connectorLogoUrl: item.connector?.imageUrl ?? null, status: item.status ?? "ACTIVE", errorMessage: null, updatedAt: new Date() } });
      for (const external of accountResult.results ?? []) {
        const currencyCode = external.currencyCode ?? "BRL";
        const existing = await tx.bankAccount.findUnique({ where: { connectionId_externalAccountId: { connectionId: connection.id, externalAccountId: external.id } } });
        const financialAccount = existing?.financialAccountId ? null : await tx.financialAccount.create({ data: { id: randomUUID(), financialSpaceId: spaceId, ownerUserId: userId, name: external.name ?? "Conta importada", bank: connection.connectorName, type: accountType(external), balanceCents: cents(external.balance), currencyCode, color: "ocean" } });
        const bankAccount = await tx.bankAccount.upsert({ where: { connectionId_externalAccountId: { connectionId: connection.id, externalAccountId: external.id } }, create: { id: randomUUID(), connectionId: connection.id, financialAccountId: financialAccount?.id, externalAccountId: external.id, name: external.name ?? "Conta importada", type: accountType(external), subtype: external.subtype ?? null, maskedNumber: external.number ? `•••• ${external.number.slice(-4)}` : null, currencyCode, currentBalanceCents: cents(external.balance), availableBalanceCents: cents(external.availableBalance) }, update: { name: external.name ?? "Conta importada", type: accountType(external), subtype: external.subtype ?? null, maskedNumber: external.number ? `•••• ${external.number.slice(-4)}` : null, currencyCode, currentBalanceCents: cents(external.balance), availableBalanceCents: cents(external.availableBalance), updatedAt: new Date() } });
        const transactions = await getAllTransactions(external.id);
        for (const externalTransaction of transactions) {
          const externalId = externalTransaction.id;
          const date = new Date(externalTransaction.date ?? new Date());
          const amountCents = signedAmount(externalTransaction);
          const categoryName = externalTransaction.category?.trim() || (amountCents < 0 ? "Despesas importadas" : "Receitas importadas");
          const category = await tx.category.upsert({ where: { id: `${spaceId}:${categoryName}` }, create: { id: `${spaceId}:${categoryName}`, financialSpaceId: spaceId, name: categoryName, kind: amountCents < 0 ? "expense" : "income", color: "ocean" }, update: {} });
          const data = { description: externalTransaction.description ?? externalTransaction.merchant?.name ?? "Transação importada", merchantName: externalTransaction.merchant?.name ?? null, amountCents, kind: amountCents < 0 ? "expense" : "income", categoryId: category.id, source: "OPEN_FINANCE", competenceDate: date, updatedAt: new Date(), bankAccountId: bankAccount.id };
          const current = await tx.transaction.findFirst({ where: { bankAccountId: bankAccount.id, externalTransactionId: externalId } });
          if (current) await tx.transaction.update({ where: { id: current.id }, data });
          else await tx.transaction.create({ data: { id: randomUUID(), financialSpaceId: spaceId, accountId: bankAccount.financialAccountId ?? financialAccount!.id, externalTransactionId: externalId, ...data } });
        }
      }
      await tx.bankConnection.update({ where: { id: connection.id }, data: { lastSyncedAt: new Date(), status: "ACTIVE", errorMessage: null, updatedAt: new Date() } });
    });
  } catch (error) {
    const message = errorMessage(error);
    await prisma.bankConnection.updateMany({ where: { financialSpaceId: spaceId, userId, externalItemId: itemId }, data: { status: "ERROR", errorMessage: message, updatedAt: new Date() } });
    throw new Error(message);
  }
}

export async function disconnectOpenFinance(spaceId: string, connectionId: string) {
  await requireSpaceAccess(spaceId, "accounts:write");
  const result = await prisma.bankConnection.updateMany({ where: { id: connectionId, financialSpaceId: spaceId }, data: { status: "DISCONNECTED", updatedAt: new Date() } });
  if (!result.count) throw new Error("CONNECTION_NOT_FOUND");
}
