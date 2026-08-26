import assert from "node:assert/strict";

process.env.PLUGGY_CLIENT_ID = "test-client-id";
process.env.PLUGGY_CLIENT_SECRET = "test-client-secret";
process.env.PLUGGY_BASE_URL = "https://pluggy.test";

const requests: Array<{ url: string; init?: RequestInit }> = [];
globalThis.fetch = async (input, init) => {
  requests.push({ url: String(input), init });
  if (String(input).endsWith("/auth")) return new Response(JSON.stringify({ apiKey: "server-api-key", expiresIn: 3600 }), { status: 200 });
  return new Response(JSON.stringify({ accessToken: "connect-token" }), { status: 200 });
};

(async () => {
  const { createConnectToken } = await import("@/server/pluggy");
  const result = await createConnectToken("user-123");
  assert.equal(result.accessToken, "connect-token");
  assert.equal(requests.length, 2);
  assert.equal(requests[0].url, "https://pluggy.test/auth");
  assert.equal(requests[1].url, "https://pluggy.test/connect_token");
  assert.equal((requests[1].init?.headers as Record<string, string>)["x-api-key"], "server-api-key");
  assert.deepEqual(JSON.parse(String(requests[1].init?.body)), { options: { clientUserId: "user-123", avoidDuplicates: true } });
  assert.ok(!JSON.stringify(requests[1]).includes("test-client-secret"));
  console.log("pluggy integration: ok");
})().catch((error) => { console.error(error); process.exitCode = 1; });
