/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Module`: both forms construct and stay `instanceof Module`, each call makes its
 *          own class, the registry records the options of the called form and `{}` for the bare one, a module is
 *          not a service, `imports` refuses a class of another kind and the base is abstract.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 16
 *                     and 25); ADR 0305 (rule 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { Module } from "#core/bases/module.base";
import { Service } from "#core/bases/service.base";
import { kindOf } from "#core/functions/kind-of.function";
import type { ModuleClass } from "#core/types/module-class.type";

class LoyaltyService extends Service {}

class LoyaltyModule extends Module({ exports: [LoyaltyService] }) {}

class ThemeModule extends Module {}

class AppModule extends Module({ imports: [LoyaltyModule, ThemeModule] }) {}

describe("Module", () => {
  it("constructs in both forms and stays an instance of Module", () => {
    expect(new LoyaltyModule()).toBeInstanceOf(Module);
    expect(new ThemeModule()).toBeInstanceOf(Module);
    expect(new LoyaltyModule()).not.toBeInstanceOf(Service);
  });

  it("records the options of the called form and nothing for the bare one", () => {
    expect(kindOf(LoyaltyModule)).toEqual({
      kind: "module",
      options: { exports: [LoyaltyService] },
    });
    expect(kindOf(AppModule)?.options["imports"]).toEqual([LoyaltyModule, ThemeModule]);
    expect(kindOf(ThemeModule)).toEqual({ kind: "module", options: {} });
    expect(Object.isFrozen(kindOf(LoyaltyModule)?.options)).toBe(true);
  });

  it("makes a distinct class per call and keeps the bare form's parent", () => {
    expect(Object.getPrototypeOf(LoyaltyModule)).not.toBe(Object.getPrototypeOf(AppModule));
    expect(Object.getPrototypeOf(ThemeModule)).toBe(Module);
    expect(Module.name).toBe("Module");
  });

  it("refuses a class of another kind in imports, and direct construction", () => {
    const classes: ModuleClass[] = [LoyaltyModule, ThemeModule];
    // @ts-expect-error -- imports takes module classes only
    class WrongImports extends Module({ imports: [LoyaltyService] }) {}
    // @ts-expect-error -- the base is abstract
    const direct = new Module();
    expect([classes, WrongImports, direct]).toHaveLength(3);
  });
});
