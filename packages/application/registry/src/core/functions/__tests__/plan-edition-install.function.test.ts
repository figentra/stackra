/**
 * Stackra file contract:
 * Purpose: unit tests of `planEditionInstall`: the bundle installs in dependency order with installed modules left
 *          out, a module outside the bundle is never pulled in, unknown modules and cycles stop the plan, and an
 *          enhancing module is planned with its contribution inert until the enhanced module is present.
 * Boundary: test only; the modules are test data.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0335 (decisions 5 and 6); ADR 0350 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { planEditionInstall } from "#core/functions/plan-edition-install.function";

const modules = [
  { key: "catalog", dependsOn: [] },
  { key: "orders", dependsOn: ["catalog"] },
  { key: "tills", dependsOn: ["orders"] },
  { key: "fashion_sizes", dependsOn: ["catalog"], enhances: ["tills"] },
];

describe("planEditionInstall", () => {
  it("orders the bundle by dependency and leaves installed modules out", () => {
    expect(
      planEditionInstall(
        { modules: ["fashion_sizes"], bundles: ["orders", "catalog", "tills"] },
        modules,
        [],
      ),
    ).toEqual({ install: ["catalog", "fashion_sizes", "orders", "tills"], inert: {}, issues: [] });
    expect(
      planEditionInstall({ modules: ["fashion_sizes"], bundles: ["catalog"] }, modules, ["catalog"])
        .install,
    ).toEqual(["fashion_sizes"]);
  });

  it("keeps an enhancing contribution inert until its target is present", () => {
    expect(
      planEditionInstall({ modules: ["fashion_sizes"], bundles: ["catalog"] }, modules, []),
    ).toEqual({
      install: ["catalog", "fashion_sizes"],
      inert: { fashion_sizes: ["tills"] },
      issues: [],
    });
  });

  it("never pulls in a base module the edition does not bundle", () => {
    const plan = planEditionInstall({ modules: [], bundles: ["orders"] }, modules, []);
    expect(plan.install).toEqual([]);
    expect(plan.issues).toEqual([
      expect.objectContaining({ code: "missing_dependency", module: "orders" }),
    ]);
  });

  it("stops on an unknown module and on a cycle", () => {
    expect(
      planEditionInstall({ modules: ["ghost"], bundles: [] }, modules, []).issues[0]?.code,
    ).toBe("unknown_module");
    const looped = [
      { key: "a", dependsOn: ["b"] },
      { key: "b", dependsOn: ["a"] },
    ];
    expect(planEditionInstall({ modules: ["a", "b"], bundles: [] }, looped, []).issues).toEqual([
      expect.objectContaining({ code: "dependency_cycle", module: "a" }),
    ]);
  });
});
