/**
 * Stackra file contract:
 * Purpose: unit tests of `ForbiddenError`: a refusal of kind `Forbidden` with code `forbidden`, category `forbidden` (HTTP 403),
 *          not retryable, carrying no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0140.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ErrorKind } from "#core/enums/error-kind.enum";
import { ForbiddenError } from "#core/errors/forbidden.error";
import { isRefusal } from "#core/functions/is-refusal.function";

describe("ForbiddenError", () => {
  it("is a Forbidden refusal with code forbidden", () => {
    const refused = ForbiddenError.create();
    expect(isRefusal(refused, ForbiddenError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Forbidden);
    expect(refused.code).toBe("forbidden");
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(403);
  });

  it("has the envelope of ADR 0140 with no details", () => {
    expect(ForbiddenError.envelope()).toEqual({
      code: "forbidden",
      category: "forbidden",
      retryable: false,
    });
  });
});
