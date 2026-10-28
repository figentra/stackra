/**
 * Stackra file contract:
 * Purpose: unit tests of `checkModelScope`: in a service running @stackra/tenancy, a model with neither an owner
 *          trait nor `Model.global` is refused (`model_tenancy_missing`); an owned, a global and a model extending an
 *          owned own model pass; a service without tenancy and a package are not checked.
 * Boundary: test only; runs on the commerce IR fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0239 (decision 1); ADR 0210 (2026-10-24 amendment).
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

  it("checks nothing without tenancy or outside a service", () => {
    expect(checkModelScope(COMMERCE_IR)).toEqual([]);
    expect(checkModelScope({ ...withModel({}), layout: "package" })).toEqual([]);
  });
});
