/**
 * Stackra file contract:
 * Purpose: unit tests of `MixedCurrencyError`: a `failed_precondition` refusal with the code `mixed_currency` that
 *          carries the summed field.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0307 (rule 16); ADR 0140; ADR 0022; ADR 0269.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { MixedCurrencyError } from "#core/errors/mixed-currency.error";

describe("MixedCurrencyError", () => {
  it("is a failed-precondition refusal naming the field", () => {
    const error = MixedCurrencyError.create({ field: "total.minor" });
    expect(isRefusal(error, MixedCurrencyError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.FailedPrecondition);
    expect(error.toEnvelope()).toMatchObject({
      code: "mixed_currency",
      details: { field: "total.minor" },
    });
  });
});
