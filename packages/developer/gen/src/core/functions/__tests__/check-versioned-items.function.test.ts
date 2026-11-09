/**
 * Stackra file contract:
 * Purpose: unit tests of `checkVersionedItems`: a member on `@stackra/versioning` whose output schema lists items with a
 *          dated `Change` warns (`versioned_items_not_applied`); the same member with no change on the items, or a
 *          member without the package, passes.
 * Boundary: test only; runs on the commerce IR fixture, whose `ListOrdersOutput` lists `OrderView` items.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0118 (decision 2); STA-2532.
 */
import { describe, expect, it } from "@stackra/testing";

import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { checkVersionedItems } from "#core/functions/check-versioned-items.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** A dated change of `OrderView`, or an event-style (numbered) one. */
function change(from: unknown): DeclaredClass {
  return {
    name: "OrderViewV1Change",
    kind: "change",
    module: "orders",
    file: "src/modules/orders/schemas/order-view-v1.change.ts",
    importPath: "#modules/orders/schemas/order-view-v1.change",
    options: { from, sunset: "2028-03-01" },
    partner: { name: "OrderView", from: "#modules/orders/schemas/order-view.schema" },
    deps: [],
    facets: [],
    methods: ["down"],
    refusals: [],
    statics: {},
    traits: [],
  } as DeclaredClass;
}

/** The commerce member on the package, with `changes` declared. */
function versioned(...changes: DeclaredClass[]): MemberIR {
  return {
    ...COMMERCE_IR,
    packages: [...(COMMERCE_IR.packages ?? []), "@stackra/versioning"],
    classes: [...COMMERCE_IR.classes, ...changes],
  };
}

describe("checkVersionedItems", () => {
  it("warns that a dated Change on the items of a list is not applied yet", () => {
    const [warning, ...rest] = checkVersionedItems(versioned(change("2027-03-01")));
    expect(rest).toEqual([]);
    expect(warning).toMatchObject({
      code: "versioned_items_not_applied",
      severity: "warning",
      subject: "ListOrdersQuery",
      message: expect.stringContaining("a Change<OrderView> on items of ListOrdersOutput."),
    });
    expect(warning?.message).toContain("is not applied yet");
  });

  it("passes with no change on the items, with an event change, and without the package", () => {
    expect(checkVersionedItems(versioned())).toEqual([]);
    expect(checkVersionedItems(versioned(change(2)))).toEqual([]);
    expect(
      checkVersionedItems({
        ...COMMERCE_IR,
        classes: [...COMMERCE_IR.classes, change("2027-03-01")],
      }),
    ).toEqual([]);
  });
});
