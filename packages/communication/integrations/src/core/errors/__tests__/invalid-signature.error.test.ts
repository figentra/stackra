/**
 * Stackra file contract:
 * Purpose: unit tests of `InvalidSignatureError`: an `unauthenticated` refusal (HTTP 401), never retryable, with no
 *          details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rule 15); ADR 0140.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { InvalidSignatureError } from "#core/errors/invalid-signature.error";

describe("InvalidSignatureError", () => {
  it("is an unauthenticated refusal with nothing of the webhook in it", () => {
    const error = InvalidSignatureError.create();
    expect(isRefusal(error, InvalidSignatureError)).toBe(true);
    expect(Enum.meta(ErrorKind, error.kind).httpStatus).toBe(401);
    expect(InvalidSignatureError.envelope()).toEqual({
      code: "invalid_signature",
      category: "unauthenticated",
      retryable: false,
    });
  });
});
