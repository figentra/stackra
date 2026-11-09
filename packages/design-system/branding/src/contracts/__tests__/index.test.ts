/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: it exports no value, and the profile, image, variants and
 *          colour types keep the shapes surfaces code against.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import type { PublicId } from "@stackra/contracts";
import type { ImageVariant } from "@stackra/media";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";

/** The `./contracts` entry. */
describe("@stackra/branding/contracts", () => {
  /** A types-only leaf. */
  it("exports no value", () => {
    expect(Object.keys(contracts)).toEqual([]);
  });

  /** The fields every surface reads. */
  it("keeps the shapes surfaces code against", () => {
    expectTypeOf<contracts.BrandProfile["displayName"]>().toEqualTypeOf<string | null>();
    expectTypeOf<contracts.BrandProfile["logo"]>().toEqualTypeOf<contracts.BrandImage | null>();
    expectTypeOf<contracts.BrandProfile["primary"]>().toEqualTypeOf<contracts.BrandColor | null>();
    expectTypeOf<contracts.BrandImage["id"]>().toEqualTypeOf<PublicId<"upl">>();
    expectTypeOf<contracts.BrandImage["variants"]["print"]>().toEqualTypeOf<ImageVariant>();
    expectTypeOf<contracts.BrandColor>().toEqualTypeOf<{
      readonly color: string;
      readonly onColor: string;
    }>();
  });
});
