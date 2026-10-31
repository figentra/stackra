/**
 * Stackra file contract:
 * Purpose: unit tests of `IdempotencyStoreNotTransactionalError`: code `idempotency_store_not_transactional`, the
 *          internal kind, not retryable, and no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0495 (note of 2026-11-01); ADR 0140.
 */
import { ErrorKind } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { IdempotencyStoreNotTransactionalError } from "#core/errors/idempotency-store-not-transactional.error";

describe("IdempotencyStoreNotTransactionalError", () => {
  it("is an internal refusal without details", () => {
    const refusal = IdempotencyStoreNotTransactionalError.create();
    expect(refusal.code).toBe("idempotency_store_not_transactional");
    expect(refusal.kind).toBe(ErrorKind.Internal);
    expect(refusal.toEnvelope()).toEqual({
      code: "idempotency_store_not_transactional",
      category: "internal",
      retryable: false,
    });
  });
});
