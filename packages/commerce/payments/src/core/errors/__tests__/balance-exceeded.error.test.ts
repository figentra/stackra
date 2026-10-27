/**
 * Stackra file contract:
 * Purpose: unit tests of `BalanceExceededError`: a failed_precondition refusal with its code, retryability and the
 *          balance and part references.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; STA-1024.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { BalanceExceededError } from "#core/errors/balance-exceeded.error";

describe("BalanceExceededError", () => {
  it("is a failed_precondition refusal carrying the balance and the part", () => {
    const refusal = BalanceExceededError.create({ balance: "chk_9", part: "chk_9:2" });
    expect(isRefusal(refusal, BalanceExceededError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal.code).toBe("balance_exceeded");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ balance: "chk_9", part: "chk_9:2" });
  });
});
