/**
 * Stackra file contract:
 * Purpose: unit tests of `RowIsolationMissingError`: a `FailedPrecondition` refusal that is not retried, with code `row_isolation_missing` and the claimed id
 *          as its one detail.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0239 (2026-11-07 amendment, gap A).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { RowIsolationMissingError } from "#core/errors/row-isolation-missing.error";

describe("RowIsolationMissingError", () => {
  it("is a FailedPrecondition refusal, not retried, with code row_isolation_missing and the claimed id", () => {
    const refused = RowIsolationMissingError.create({ id: "evt_A" });
    expect(isRefusal(refused, RowIsolationMissingError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refused.retryable).toBe(false);
    expect(refused.code).toBe("row_isolation_missing");
    expect(refused.details).toEqual({ id: "evt_A" });
  });
});
