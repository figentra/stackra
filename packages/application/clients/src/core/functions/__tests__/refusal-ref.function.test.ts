/**
 * Stackra file contract:
 * Purpose: unit tests of `refusalRef`: a consumed refusal is a `Refusal` whose code is the producer's, with its message
 *          key as `refusalKey`, its declared or default kind, its record by code, and the refused code.
 * Boundary: test only; `refusal(...)` from `@stackra/errors/testing` builds instances as the template's tests do.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140 (envelope and kinds); ADR 0232 (codes from class names).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { refusal } from "@stackra/errors/testing";
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";

import { REFUSAL_REFS } from "#core/constants/refusal-refs.constant";
import { refusalRef } from "#core/functions/refusal-ref.function";

const MESSAGE = "catalogue::errors.variant_not_found.message" as I18nKey;

class VariantNotFoundError extends refusalRef("catalogue.variant_not_found", {
  message: MESSAGE,
}) {}

class CardDeclinedError extends refusalRef("payments.card_declined", {
  kind: ErrorKind.Conflict,
  retryable: true,
}) {}

describe("refusalRef", () => {
  it("is a refusal with the producer's code and module-qualified code", () => {
    const error = refusal(VariantNotFoundError);
    expect(isRefusal(error, VariantNotFoundError)).toBe(true);
    expect(error.code).toBe("variant_not_found");
    expect(VariantNotFoundError.qualifiedCode).toBe("catalogue.variant_not_found");
  });

  it("carries the producer's message key", () => {
    expect(refusal(VariantNotFoundError).refusalKey).toBe(MESSAGE);
    expect(VariantNotFoundError.messageKey).toBe(MESSAGE);
    expect(refusal(CardDeclinedError).refusalKey).toBeUndefined();
  });

  it("declares failed_precondition unless the producer's kind is given", () => {
    expect(refusal(VariantNotFoundError).kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal(VariantNotFoundError).retryable).toBe(false);
    expect(refusal(CardDeclinedError).kind).toBe(ErrorKind.Conflict);
    expect(refusal(CardDeclinedError).retryable).toBe(true);
  });

  it("is told apart from a refusal with another code", () => {
    expect(isRefusal(refusal(CardDeclinedError), VariantNotFoundError)).toBe(false);
  });

  it("records the class by its unqualified code for decoding", () => {
    expect(REFUSAL_REFS.get("variant_not_found")).toEqual([
      Object.getPrototypeOf(VariantNotFoundError),
    ]);
  });

  it("refuses a code that is not snake_case", () => {
    expect(() => refusalRef("catalogue.VariantNotFound")).toThrow(RangeError);
  });
});
