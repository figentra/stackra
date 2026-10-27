/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: exactly its values, `StackraKind`'s five codes, and the
 *          shapes of `StackraManifest`, `CatalogueItem`, `CataloguePage` and `ItemsLock`.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); ADR 0453 (decisions 11 and 12).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type {
  CatalogueItem,
  CataloguePage,
  ItemsLock,
  ItemsLockEntry,
  StackraManifest,
} from "#contracts/index";
import { StackraKind } from "#contracts/index";

describe("@stackra/skills/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "CATALOGUE_ITEM_SCHEMA",
      "CATALOGUE_PAGE_SCHEMA",
      "ITEMS_LOCK_SCHEMA",
      "ITEM_PACKAGE_NAME_PATTERN",
      "STACKRA_MANIFEST_SCHEMA",
      "StackraKind",
    ]);
  });

  it("lists the five kinds of ADR 0453", () => {
    expect(Enum.values(StackraKind)).toEqual(["package", "skill", "agent", "mcp", "plugin"]);
    expectTypeOf<StackraKind>().toEqualTypeOf<"package" | "skill" | "agent" | "mcp" | "plugin">();
  });

  it("types the manifest, the catalogue and the lock", () => {
    expectTypeOf<StackraManifest["kind"]>().toEqualTypeOf<StackraKind>();
    expectTypeOf<Extract<StackraManifest, { kind: "mcp" }>["mcp"]>().toEqualTypeOf<
      Readonly<Record<string, unknown>>
    >();
    expectTypeOf<CatalogueItem["access"]>().toEqualTypeOf<"open" | "licensed">();
    expectTypeOf<CatalogueItem["stackra"]>().toEqualTypeOf<StackraManifest>();
    expectTypeOf<CataloguePage["next"]>().toEqualTypeOf<string | null>();
    expectTypeOf<ItemsLock["lockfileVersion"]>().toEqualTypeOf<1>();
    expectTypeOf<ItemsLockEntry["kind"]>().toEqualTypeOf<"skill" | "agent" | "mcp" | "plugin">();
  });
});
