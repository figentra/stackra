/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: it exports the `OgRenderer` port the generated wiring
 *          imports, and the `OgCard` type its signature names, with the fields the OG image route passes.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias. Type exports are checked by type.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { OgCard } from "#contracts/index";

describe("@stackra/seo/contracts", () => {
  it("exports exactly the port at run time", () => {
    expect(Object.keys(contracts)).toEqual(["OgRenderer"]);
  });

  it("types the card the OG image route passes", () => {
    expectTypeOf<OgCard["dir"]>().toEqualTypeOf<"ltr" | "rtl">();
    expectTypeOf<OgCard["image"]>().toEqualTypeOf<string | undefined>();
    const brand: Partial<
      Record<"accent" | "accent-foreground", { readonly hexLight: string; readonly light: string }>
    > = { accent: { hexLight: "#D9462B", light: "oklch(60% 0.2 30)" } };
    expectTypeOf(brand).toMatchTypeOf<OgCard["brand"]>();
  });
});
