/**
 * Stackra file contract:
 * Purpose: unit tests of `AmountWordsUnavailableError`: kind `failed_precondition` (HTTP 412), code `amount_words_unavailable`, not retryable, with its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0140; ADR 0365.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { AmountWordsUnavailableError } from "#core/errors/amount-words-unavailable.error";

describe("AmountWordsUnavailableError", () => {
  it("is a failed_precondition refusal carrying its details", () => {
    const error = AmountWordsUnavailableError.create({ language: "fr" });
    expect(isRefusal(error, AmountWordsUnavailableError)).toBe(true);
    expect(Enum.meta(ErrorKind, error.kind).httpStatus).toBe(412);
    expect(error.toEnvelope()).toEqual({
      code: "amount_words_unavailable",
      category: Enum.meta(ErrorKind, error.kind).category,
      retryable: false,
      details: { language: "fr" },
    });
  });
});
