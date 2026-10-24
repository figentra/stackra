/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ErrorKind`: exactly the ten kinds of ADR 0140, snake_case codes, the category of
 *          each (only `failed_precondition` reports `precondition_failed`), the kind-to-status map and the default
 *          retry flags.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0140 (decisions 2 and
 *                     3); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ErrorKind } from "#core/enums/error-kind.enum";

describe("ErrorKind", () => {
  it("has the ten kinds, each a snake_case code", () => {
    expect(Enum.values(ErrorKind)).toEqual([
      "validation",
      "unauthenticated",
      "entitlement_required",
      "forbidden",
      "not_found",
      "conflict",
      "failed_precondition",
      "rate_limited",
      "unavailable",
      "internal",
    ]);
    for (const kind of Enum.values(ErrorKind)) expect(kind).toMatch(/^[a-z]+(_[a-z]+)*$/);
    expectTypeOf<ErrorKind>().toEqualTypeOf<
      | "validation"
      | "unauthenticated"
      | "entitlement_required"
      | "forbidden"
      | "not_found"
      | "conflict"
      | "failed_precondition"
      | "rate_limited"
      | "unavailable"
      | "internal"
    >();
  });

  it("maps each kind to its category and HTTP status (ADR 0140)", () => {
    const table = Object.fromEntries(
      Enum.values(ErrorKind).map((kind) => {
        const { category, httpStatus } = Enum.meta(ErrorKind, kind);
        return [kind, [category, httpStatus]];
      }),
    );
    expect(table).toEqual({
      validation: ["validation", 400],
      unauthenticated: ["unauthenticated", 401],
      entitlement_required: ["entitlement_required", 402],
      forbidden: ["forbidden", 403],
      not_found: ["not_found", 404],
      conflict: ["conflict", 409],
      failed_precondition: ["precondition_failed", 412],
      rate_limited: ["rate_limited", 429],
      unavailable: ["unavailable", 503],
      internal: ["internal", 500],
    });
  });

  it("defaults to retryable only for rate_limited and unavailable", () => {
    const retryable = Enum.values(ErrorKind).filter((kind) => Enum.meta(ErrorKind, kind).retryable);
    expect(retryable).toEqual([ErrorKind.RateLimited, ErrorKind.Unavailable]);
  });
});
