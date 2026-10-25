/**
 * Stackra file contract:
 * Purpose: unit tests of `PackNotFoundError`: a NotFound refusal with code pack_not_found that names the market and pin, and requires the market.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { PackNotFoundError } from "#core/errors/pack-not-found.error";

describe("PackNotFoundError", () => {
  it("is a NotFound refusal with code pack_not_found", () => {
    const refused = PackNotFoundError.create({ market: "xa" });
    expect(isRefusal(refused, PackNotFoundError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.NotFound);
    expect(refused.code).toBe("pack_not_found");
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(404);
  });

  it("names the market and pin in its envelope", () => {
    expect(PackNotFoundError.envelope({ market: "xa", pin: "2" })).toEqual({
      code: "pack_not_found",
      category: "not_found",
      retryable: false,
      details: { market: "xa", pin: "2" },
    });
  });

  it("requires the market", () => {
    // @ts-expect-error -- `market` is required
    expect(PackNotFoundError.create().code).toBe("pack_not_found");
  });
});
