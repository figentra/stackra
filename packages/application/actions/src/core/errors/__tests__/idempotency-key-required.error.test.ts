/**
 * Stackra file contract:
 * Purpose: unit tests of `IdempotencyKeyRequiredError`: code `idempotency_key_required`, the validation kind, not
 *          retryable, and no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0136 (decision 3); ADR 0140.
 */
import { ErrorKind } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { IdempotencyKeyRequiredError } from "#core/errors/idempotency-key-required.error";

describe("IdempotencyKeyRequiredError", () => {
  it("is a validation refusal without details", () => {
    const refusal = IdempotencyKeyRequiredError.create();
    expect(refusal.code).toBe("idempotency_key_required");
    expect(refusal.kind).toBe(ErrorKind.Validation);
    expect(refusal.toEnvelope()).toEqual({
      code: "idempotency_key_required",
      category: "validation",
      retryable: false,
    });
  });
});
