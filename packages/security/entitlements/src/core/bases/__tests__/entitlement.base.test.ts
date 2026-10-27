/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `Entitlement` kind base: the template's limit and a feature and a module record
 *          their options, a limit records its `where` filter, a limit without `counts`, a feature with one or with a `where`, a
 *          `where` that is not field equality and an unknown kind are refused at declaration,
 *          and the kind is called only.
 * Boundary: test only; the limit restates the template's `catalogue/access/product-limit.entitlement.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 16 and
 *                     25); ADR 0215 (decision 1).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Entitlement } from "#core/bases/entitlement.base";
import { EntitlementKind } from "#core/enums/entitlement-kind.enum";
import type { EntitlementClass } from "#core/types/entitlement-class.type";

class Product {}

class ProductLimitEntitlement extends Entitlement({
  kind: EntitlementKind.Limit,
  counts: () => Product,
}) {}

class ReportsEntitlement extends Entitlement({ kind: EntitlementKind.Feature }) {}

class CatalogueEntitlement extends Entitlement({ kind: EntitlementKind.Module }) {}

describe("Entitlement", () => {
  it("records a limit with the model it counts", () => {
    const record = kindOf(ProductLimitEntitlement);
    const options = record?.options ?? {};
    expect(record?.kind).toBe("entitlement");
    expect(options.kind).toBe("limit");
    expect((options.counts as () => unknown)()).toBe(Product);
  });

  it("records a feature and a module with no counted model", () => {
    expect(kindOf(ReportsEntitlement)).toEqual({
      kind: "entitlement",
      options: { kind: "feature" },
    });
    expect(kindOf(CatalogueEntitlement)?.options).toEqual({ kind: "module" });
  });

  it("keeps instanceof and a class per call", () => {
    expect(new ReportsEntitlement()).toBeInstanceOf(Entitlement);
    expect(Object.getPrototypeOf(ReportsEntitlement)).not.toBe(
      Object.getPrototypeOf(CatalogueEntitlement),
    );
    expect((Entitlement as unknown as { name: string }).name).toBe("Entitlement");
  });

  it("refuses a limit without counts and another kind with one", () => {
    expect(() => Entitlement({ kind: EntitlementKind.Limit })).toThrow(/names the model it counts/);
    expect(() => Entitlement({ kind: EntitlementKind.Feature, counts: () => Product })).toThrow(
      TypeError,
    );
  });

  it("records a limit's where filter and refuses one elsewhere or of the wrong shape", () => {
    class TillLimitEntitlement extends Entitlement({
      kind: EntitlementKind.Limit,
      counts: () => Product,
      where: { retiredAt: null },
    }) {}
    expect(kindOf(TillLimitEntitlement)?.options["where"]).toEqual({ retiredAt: null });
    expect(() =>
      Entitlement({ kind: EntitlementKind.Feature, where: { retiredAt: null } }),
    ).toThrow(/Only a limit/);
    expect(() =>
      Entitlement({
        kind: EntitlementKind.Limit,
        counts: () => Product,
        // @ts-expect-error -- equality on scalars only
        where: { retiredAt: { lt: "2026-01-01" } },
      }),
    ).toThrow(/field equality/);
  });

  it("refuses a kind outside EntitlementKind", () => {
    // @ts-expect-error -- not an entitlement kind
    expect(() => Entitlement({ kind: "seat" })).toThrow(RangeError);
  });

  it("is called only and returns an entitlement class", () => {
    expectTypeOf(Entitlement({ kind: EntitlementKind.Feature })).toEqualTypeOf<EntitlementClass>();
    // @ts-expect-error -- `kind` is required
    expect(() => Entitlement({})).toThrow(RangeError);
  });
});
