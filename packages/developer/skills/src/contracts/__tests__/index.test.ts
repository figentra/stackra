/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: exactly its values, `StackraKind`'s five codes, the
 *          package vocabularies (`StackraTier`, `StackraCategory`, `StackraRuntime`), and the shapes of
 *          `StackraPackageField`, `CatalogueItem`, `CataloguePage` and `ItemsLock`.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); ADR 0453 (decisions 11 and 12, amendment of
 *                     2026-10-27).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type {
  CatalogueItem,
  CataloguePage,
  ItemsLock,
  ItemsLockEntry,
  StackraPackageField,
} from "#contracts/index";
import { StackraCategory, StackraKind, StackraRuntime, StackraTier } from "#contracts/index";

describe("@stackra/skills/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "CATALOGUE_ITEM_SCHEMA",
      "CATALOGUE_PAGE_SCHEMA",
      "ITEMS_LOCK_SCHEMA",
      "ITEM_PACKAGE_NAME_PATTERN",
      "STACKRA_MANIFEST_SCHEMA",
      "StackraCategory",
      "StackraKind",
      "StackraRuntime",
      "StackraTier",
    ]);
  });

  it("lists the five kinds of ADR 0453", () => {
    expect(Enum.values(StackraKind)).toEqual(["package", "skill", "agent", "mcp", "plugin"]);
    expectTypeOf<StackraKind>().toEqualTypeOf<"package" | "skill" | "agent" | "mcp" | "plugin">();
  });

  it("lists the tiers, the package categories and the header runtimes", () => {
    expect(Enum.values(StackraTier)).toEqual(["lib", "app", "service", "config"]);
    expect(Enum.values(StackraCategory)).toEqual([
      "application",
      "commerce",
      "communication",
      "cross-cutting",
      "data",
      "design-system",
      "developer",
      "experience",
      "foundation",
      "infrastructure",
      "runtime",
      "security",
      "state",
      "tooling",
    ]);
    expect(Enum.values(StackraRuntime)).toEqual([
      "isomorphic",
      "node",
      "browser",
      "worker",
      "react-native",
    ]);
  });

  it("types the manifest, the catalogue and the lock", () => {
    expectTypeOf<StackraPackageField["kind"]>().toEqualTypeOf<StackraKind>();
    expectTypeOf<Extract<StackraPackageField, { kind: "mcp" }>["mcp"]>().toEqualTypeOf<
      Readonly<Record<string, unknown>>
    >();
    type PackageField = Extract<StackraPackageField, { kind: "package" }>;
    expectTypeOf<PackageField["tier"]>().toEqualTypeOf<StackraTier | undefined>();
    expectTypeOf<PackageField["category"]>().toEqualTypeOf<StackraCategory | undefined>();
    expectTypeOf<PackageField["runtimes"]>().toEqualTypeOf<readonly StackraRuntime[] | undefined>();
    expectTypeOf<PackageField["summary"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<CatalogueItem["access"]>().toEqualTypeOf<"open" | "licensed">();
    expectTypeOf<CatalogueItem["stackra"]>().toEqualTypeOf<StackraPackageField>();
    expectTypeOf<CataloguePage["next"]>().toEqualTypeOf<string | null>();
    expectTypeOf<ItemsLock["lockfileVersion"]>().toEqualTypeOf<1>();
    expectTypeOf<ItemsLockEntry["kind"]>().toEqualTypeOf<"skill" | "agent" | "mcp" | "plugin">();
  });
});
