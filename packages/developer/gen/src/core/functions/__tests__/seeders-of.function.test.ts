/**
 * Stackra file contract:
 * Purpose: unit tests of `seedersOf`: own seeders in module-dependency order against path order, ties by file, with
 *          the identity `<module>.<profile>`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); spec sta-2061 (FR-002, FR-006, AC-004).
 */
import { describe, expect, it } from "@stackra/testing";

import { seedersOf } from "#core/functions/seeders-of.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

/** A class of `module` at `file`. */
function declared(
  name: string,
  kind: string,
  module: string,
  file: string,
  deps: DeclaredClass["deps"] = [],
): DeclaredClass {
  return {
    name,
    kind,
    module,
    file,
    importPath: `#modules/${module}/${file}`,
    options: {},
    deps,
    facets: [],
    methods: [],
    refusals: [],
    statics: {},
    traits: [],
  };
}

describe("seedersOf", () => {
  // `a_orders` sorts first by path but depends on `b_catalogue` through a service.
  const ir: MemberIR = {
    ...COMMERCE_IR,
    modules: ["a_orders", "b_catalogue"],
    classes: [
      declared(
        "OrdersDemoSeeder",
        "seeder",
        "a_orders",
        "src/modules/a_orders/seeders/demo.seeder.ts",
      ),
      declared(
        "OrdersMinimalSeeder",
        "seeder",
        "a_orders",
        "src/modules/a_orders/seeders/minimal.seeder.ts",
      ),
      declared(
        "PricingService",
        "service",
        "a_orders",
        "src/modules/a_orders/services/pricing.service.ts",
        [
          {
            class: {
              name: "CatalogueService",
              from: "#modules/b_catalogue/services/catalogue.service",
            },
          },
        ],
      ),
      declared(
        "CatalogueService",
        "service",
        "b_catalogue",
        "src/modules/b_catalogue/services/catalogue.service.ts",
      ),
      declared(
        "CatalogueDemoSeeder",
        "seeder",
        "b_catalogue",
        "src/modules/b_catalogue/seeders/demo.seeder.ts",
      ),
    ],
  };

  it("lists a module's seeders after the modules it depends on, ties by file (@covers sta-2061:FR-006)", () => {
    expect(seedersOf(ir).map((row) => row.key)).toEqual([
      "b_catalogue.demo",
      "a_orders.demo",
      "a_orders.minimal",
    ]);
  });

  it("derives the profile from the file stem and keeps the class and import", () => {
    expect(seedersOf(ir)[0]).toMatchObject({
      module: "b_catalogue",
      profile: "demo",
      name: "CatalogueDemoSeeder",
    });
  });
});
