/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: it exports `assets` (the template's generated `#stackra/assets`
 *          calls it) and the `AssetLibrary` service `useAsset` resolves, nothing else, and the public types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as core from "#core/index";
import type { AssetEntry, AssetKey, AssetTree, ResolvedAsset } from "#core/index";

describe("@stackra/assets", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(core).sort()).toEqual(["AssetHashMismatchError", "AssetLibrary", "assets"]);
  });

  it("resolves its public types", () => {
    const key: AssetKey = "orders::public/images/eg.svg";
    expect(key).toBe("orders::public/images/eg.svg");
    expectTypeOf<
      AssetEntry<"web::public/logo.svg">["key"]
    >().toEqualTypeOf<"web::public/logo.svg">();
    expectTypeOf<AssetEntry["overridable"]>().toEqualTypeOf<boolean>();
    expectTypeOf<ResolvedAsset<"web::public/logo.svg">["url"]>().toEqualTypeOf<string>();
    expectTypeOf<AssetTree[string][string][string]>().toEqualTypeOf<AssetEntry>();
    // @ts-expect-error a key needs the `::` namespace and a kind folder
    const bare: AssetKey = "logo.svg";
    expect(bare).toBe("logo.svg");
  });
});
