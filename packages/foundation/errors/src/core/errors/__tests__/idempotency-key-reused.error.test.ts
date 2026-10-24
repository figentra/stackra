/**
 * Stackra file contract:
 * Purpose: unit tests of `IdempotencyKeyReusedError`: a refusal of kind `Conflict` with code `idempotency_key_reused`, category `conflict` (HTTP 409),
 *          not retryable, carrying no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0140.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ErrorKind } from "#core/enums/error-kind.enum";
import { IdempotencyKeyReusedError } from "#core/errors/idempotency-key-reused.error";
import { isRefusal } from "#core/functions/is-refusal.function";

describe("IdempotencyKeyReusedError", () => {
  it("is a Conflict refusal with code idempotency_key_reused", () => {
    const refused = IdempotencyKeyReusedError.create();
    expect(isRefusal(refused, IdempotencyKeyReusedError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Conflict);
    expect(refused.code).toBe("idempotency_key_reused");
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(409);
  });

  it("has the envelope of ADR 0140 with no details", () => {
    expect(IdempotencyKeyReusedError.envelope()).toEqual({
      code: "idempotency_key_reused",
      category: "conflict",
      retryable: false,
    });
  });
});
