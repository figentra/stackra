/**
 * Stackra file contract:
 * Purpose: unit tests of `ConnectedAccountLimitsMissingError`: a failed_precondition refusal with its code,
 *          retryability and connection id.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; STA-1707.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ConnectedAccountLimitsMissingError } from "#core/errors/connected-account-limits-missing.error";

describe("ConnectedAccountLimitsMissingError", () => {
  it("is a failed_precondition refusal carrying its connection id", () => {
    const refusal = ConnectedAccountLimitsMissingError.create({ connectionId: "conn_9" });
    expect(isRefusal(refusal, ConnectedAccountLimitsMissingError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal.code).toBe("connected_account_limits_missing");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ connectionId: "conn_9" });
  });
});
