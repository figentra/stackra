/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalDriverMissingError`: a `fiscal_driver_missing` refusal of kind `FailedPrecondition`
 *          whose details are its fields.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0364.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { FiscalDriverMissingError } from "#core/errors/fiscal-driver-missing.error";

describe("FiscalDriverMissingError", () => {
  it("carries its kind, code, retry flag and details", () => {
    const refusal = FiscalDriverMissingError.create({
      market: "sa",
      channel: "till",
      driver: "zatca",
    });
    expect(isRefusal(refusal, FiscalDriverMissingError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal.code).toBe("fiscal_driver_missing");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ market: "sa", channel: "till", driver: "zatca" });
  });
});
