/**
 * Stackra file contract:
 * Purpose: unit tests of `NotFoundError`: a refusal of kind `NotFound` with code `not_found`, category `not_found` (HTTP 404),
 *          not retryable, carrying no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0140.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ErrorKind } from "#core/enums/error-kind.enum";
import { NotFoundError } from "#core/errors/not-found.error";
import { isRefusal } from "#core/functions/is-refusal.function";

describe("NotFoundError", () => {
  it("is a NotFound refusal with code not_found", () => {
    const refused = NotFoundError.create();
    expect(isRefusal(refused, NotFoundError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.NotFound);
    expect(refused.code).toBe("not_found");
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(404);
  });

  it("has the envelope of ADR 0140 with no details", () => {
    expect(NotFoundError.envelope()).toEqual({
      code: "not_found",
      category: "not_found",
      retryable: false,
    });
  });
});
