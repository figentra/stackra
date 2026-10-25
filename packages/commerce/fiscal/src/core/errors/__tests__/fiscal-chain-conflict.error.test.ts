/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalChainConflictError`: a `fiscal_chain_conflict` refusal of kind `Conflict` whose details
 *          are its fields.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0364.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { FiscalChainConflictError } from "#core/errors/fiscal-chain-conflict.error";

describe("FiscalChainConflictError", () => {
  it("carries its kind, code, retry flag and details", () => {
    const refusal = FiscalChainConflictError.create({ unitId: "till_1", sequence: 42 });
    expect(isRefusal(refusal, FiscalChainConflictError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.Conflict);
    expect(refusal.code).toBe("fiscal_chain_conflict");
    expect(refusal.retryable).toBe(true);
    expect(refusal.details).toEqual({ unitId: "till_1", sequence: 42 });
  });
});
