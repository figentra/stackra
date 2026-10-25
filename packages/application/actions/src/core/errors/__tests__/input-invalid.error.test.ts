/**
 * Stackra file contract:
 * Purpose: unit tests of `InputInvalidError`: code `input_invalid`, the validation kind and category, not retryable,
 *          and its field errors in the envelope.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0140 (the envelope).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { InputInvalidError } from "#core/errors/input-invalid.error";

describe("InputInvalidError", () => {
  it("is a validation refusal with field errors", () => {
    const refusal = InputInvalidError.create(
      {},
      { fieldErrors: { "lines.0.quantity": "Too small" } },
    );
    expect(isRefusal(refusal)).toBe(true);
    expect(refusal.code).toBe("input_invalid");
    expect(refusal.kind).toBe(ErrorKind.Validation);
    expect(refusal.retryable).toBe(false);
    expect(refusal.toEnvelope()).toEqual({
      code: "input_invalid",
      category: "validation",
      retryable: false,
      fieldErrors: { "lines.0.quantity": "Too small" },
    });
  });
});
