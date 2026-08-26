import "dotenv/config";

const baseUrl = process.env.PLUGGY_BASE_URL ?? "https://api.pluggy.ai";
const clientId = process.env.PLUGGY_CLIENT_ID;
const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

async function main() {
  if (!clientId || !clientSecret) {
    throw new Error("Configure PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET no ambiente.");
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/auth`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Pluggy auth falhou (HTTP ${response.status}): ${body.slice(0, 240)}`);
  }

  const payload = (await response.json()) as { apiKey?: string; expiresIn?: number };
  if (!payload.apiKey) throw new Error("A resposta da Pluggy não contém apiKey.");

  console.log(payload.apiKey);
  if (payload.expiresIn) console.error(`Válida por aproximadamente ${payload.expiresIn} segundos.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Falha inesperada na autenticação Pluggy.");
  process.exitCode = 1;
});
