/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: exactly its three enums are values, and the kit file,
 *          options, manifest and check result types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import type { LocalizedText } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { BrandKit, BrandKitOptions, BrandOutput, KitStatus } from "#contracts/index";

describe("@stackra/brand-kit/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual(["BrandOutput", "Endorsement", "KitStatus"]);
  });

  it("resolves the public types", () => {
    expectTypeOf<BrandKit["status"]>().toEqualTypeOf<KitStatus>();
    expectTypeOf<BrandKit["name"]>().toEqualTypeOf<LocalizedText & { readonly en: string }>();
    expectTypeOf<BrandKitOptions["outputs"]>().toEqualTypeOf<readonly BrandOutput[] | undefined>();
  });
});
