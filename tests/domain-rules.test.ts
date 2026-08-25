import assert from "node:assert/strict";
import { isIncludedInBalance, isIncludedInForecast, parseAmountCents, resolveTransactionStatus, splitInstallments } from "@/lib/finance-rules";

assert.equal(parseAmountCents("25,90"), 2590);
assert.equal(parseAmountCents("25.90"), 2590);
assert.deepEqual(splitInstallments(1000, 3), [334, 333, 333]);
assert.equal(resolveTransactionStatus("pending", "2026-08-10", "2026-08-17"), "overdue");
assert.equal(resolveTransactionStatus("pending", "2026-08-20", "2026-08-17"), "pending");
assert.equal(isIncludedInBalance("cancelled"), false);
assert.equal(isIncludedInForecast("overdue"), true);
console.log("domain rules: ok");
