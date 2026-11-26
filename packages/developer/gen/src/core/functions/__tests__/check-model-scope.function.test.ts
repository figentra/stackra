/**
 * Stackra file contract:
 * Purpose: unit tests of `checkModelScope`: in a service running @stackra/tenancy, a model with neither an owner
 *          trait nor `Model.global` is refused (`model_tenancy_missing`); an owned, a global and a model extending an
 *          owned own model pass; a service without tenancy is not checked; a package is, as errors; an ADR-named
 *          table is skipped; an owned model whose migrated table never calls `t.belongsToTenant()` is flagged
 *          (`model_tenancy_migration_missing`).
 * Boundary: test only; runs on the commerce IR fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0239 (decision 1); ADR 0210 (2026-10-24 amendment); ADR 0368
 *                     (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkModelScope } from "#core/functions/check-model-scope.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";

const MODEL = COMMERCE_IR.classes.find((declared) => declared.kind === "model") as DeclaredClass;

/** The fixture running tenancy, its first model changed by `change`, plus `extra` classes. */
const withModel = (
  change: Partial<DeclaredClass>,
  extra: readonly DeclaredClass[] = [],
): MemberIR => ({
  ...COMMERCE_IR,
  packages: [...(COMMERCE_IR.packages ?? []), "@stackra/tenancy"],
  classes: [
    ...COMMERCE_IR.classes.map((declared) =>
      declared === MODEL ? { ...declared, ...change } : declared,
    ),
    ...extra,
  ],
});

/** A migration block of the fixture's `orders` module. */
const block = (table: string, ownerColumn: boolean, file = "0001-create-orders.migration.ts") => ({
  file,
  module: "orders",
  table,
  ownerColumn,
});

describe("checkModelScope", () => {
  it("refuses a model that is neither owned nor global", () => {
    const errors = checkModelScope(withModel({}));
    expect(errors.map((error) => [error.code, error.subject])).toEqual([
      ["model_tenancy_missing", MODEL.name],
    ]);
  });

  it("passes an owned model and a global one", () => {
    expect(
      checkModelScope(
        withModel({ traits: [...MODEL.traits, { name: "BelongsToTenant", args: [] }] }),
      ),
    ).toEqual([]);
    expect(checkModelScope(withModel({ global: true }))).toEqual([]);
  });

  it("lets a model extending an owned own model take its base's answer", () => {
    const child: DeclaredClass = {
      ...MODEL,
      name: "ArchivedOrder",
      traits: [],
      base: { name: MODEL.name, from: MODEL.importPath, own: true },
    };
    expect(
      checkModelScope(
        withModel({ traits: [{ name: "BelongsToTenantOrPlatform", args: [] }] }, [child]),
      ),
    ).toEqual([]);
  });

  it("checks nothing in a service without tenancy or in an app", () => {
    expect(checkModelScope(COMMERCE_IR)).toEqual([]);
    expect(checkModelScope({ ...withModel({}), layout: "app" })).toEqual([]);
  });

  it("refuses a package's model that is neither, with or without tenancy (the contract step)", () => {
    const refused = checkModelScope({ ...COMMERCE_IR, layout: "package" });
    expect(refused.map((error) => [error.code, error.subject, error.severity])).toEqual([
      ["model_tenancy_missing", MODEL.name, undefined],
    ]);
    expect(checkModelScope({ ...withModel({ global: true }), layout: "package" })).toEqual([]);
  });

  it("skips a table an ADR names", () => {
    const exempt = withModel({ name: "AwardVerification", module: "achievements" });
    expect(checkModelScope(exempt)).toEqual([]);
    expect(checkModelScope({ ...exempt, layout: "package" })).toEqual([]);
  });

  describe("the migration cross-check", () => {
    const owned = withModel({ traits: [{ name: "BelongsToTenant", args: [] }] });

    it("flags an owned model whose migrated table never calls t.belongsToTenant()", () => {
      const errors = checkModelScope({ ...owned, migrationTables: [block("orders", false)] });
      expect(errors.map((error) => [error.code, error.subject, error.severity])).toEqual([
        ["model_tenancy_migration_missing", MODEL.name, undefined],
      ]);
      expect(errors[0]?.message).toContain("0001-create-orders.migration.ts");
      const inPackage = checkModelScope({
        ...owned,
        layout: "package",
        migrationTables: [block("orders", false)],
      });
      expect(inPackage.map((error) => error.severity)).toEqual([undefined]);
    });

    it("passes when any migration of the table calls it, and judges no table without a migration", () => {
      expect(
        checkModelScope({
          ...owned,
          migrationTables: [
            block("orders", false),
            block("orders", true, "0002-own-orders.migration.ts"),
          ],
        }),
      ).toEqual([]);
      expect(checkModelScope({ ...owned, migrationTables: [block("order_lines", false)] })).toEqual(
        [],
      );
      expect(checkModelScope(owned)).toEqual([]);
    });
  });
});
