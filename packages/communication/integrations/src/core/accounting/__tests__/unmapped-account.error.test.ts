/**
 * Stackra file contract:
 * Purpose: unit tests of `UnmappedAccountError`: a `failed_precondition` refusal, never retryable, naming the journal's
 *          reference and the unmapped key.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0140; STA-794.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { UnmappedAccountError } from "#core/accounting/unmapped-account.error";

describe("UnmappedAccountError", () => {
  it("names the reference and the key", () => {
    const error = UnmappedAccountError.create({ reference: "inv_1", account: "sales" });
    expect(isRefusal(error, UnmappedAccountError)).toBe(true);
    expect(error.code).toBe("unmapped_account");
    expect(error.retryable).toBe(false);
    expect(error.details).toEqual({ reference: "inv_1", account: "sales" });
  });
});
