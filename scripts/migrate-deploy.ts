import { spawnSync } from "node:child_process";

const maxAttempts = 5;
const waitMs = 5_000;

function wait(delay: number) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

async function main() {
  const prismaCommand = process.platform === "win32" ? "prisma.cmd" : "prisma";

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = spawnSync(prismaCommand, ["migrate", "deploy"], { stdio: "inherit", env: process.env });
    if (result.status === 0) return;
    if (attempt < maxAttempts) await wait(waitMs * attempt);
  }

  process.exitCode = 1;
}

void main();
