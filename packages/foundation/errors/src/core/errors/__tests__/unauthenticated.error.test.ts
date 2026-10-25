/**
 * Stackra file contract:
 * Purpose: unit tests of `UnauthenticatedError`: a refusal of kind `Unauthenticated` with code `unauthenticated`, category `unauthenticated` (HTTP 401),
 *          not retryable, carrying no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0140.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ErrorKind } from "#core/enums/error-kind.enum";
import { UnauthenticatedError } from "#core/errors/unauthenticated.error";
import { isRefusal } from "#core/functions/is-refusal.function";

describe("UnauthenticatedError", () => {
  it("is a Unauthenticated refusal with code unauthenticated", () => {
    const refused = UnauthenticatedError.create();
    expect(isRefusal(refused, UnauthenticatedError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Unauthenticated);
    expect(refused.code).toBe("unauthenticated");
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(401);
  });

  it("has the envelope of ADR 0140 with no details", () => {
    expect(UnauthenticatedError.envelope()).toEqual({
      code: "unauthenticated",
      category: "unauthenticated",
      retryable: false,
    });
  });
});
