/**
 * Stackra file contract:
 * Purpose: unit tests of `IdempotencyKeyInProgressError`: a retryable `Conflict` refusal with code
 *          `idempotency_key_in_progress` (HTTP 409).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0140.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ErrorKind } from "#core/enums/error-kind.enum";
import { IdempotencyKeyInProgressError } from "#core/errors/idempotency-key-in-progress.error";

describe("IdempotencyKeyInProgressError", () => {
  it("is a retryable Conflict refusal with code idempotency_key_in_progress", () => {
    const refused = IdempotencyKeyInProgressError.create();
    expect(refused.kind).toBe(ErrorKind.Conflict);
    expect(refused.code).toBe("idempotency_key_in_progress");
    expect(refused.retryable).toBe(true);
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(409);
  });
});
