/**
 * Stackra file contract:
 * Purpose: unit tests of `clientModule`: a consumed module is a container module with its key, imported by name in an
 *          app module, booted as an empty module, and the refused key.
 * Boundary: test only; the app module restates the template's `apps/console` imports.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0305 (consumed modules by name); ADR 0294 (decision 13).
 */
import { Container, kindOf, Module } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { clientModule } from "#core/functions/client-module.function";

class OrdersModule extends clientModule("orders") {}

class ConsoleModule extends Module({ imports: [OrdersModule] }) {}

describe("clientModule", () => {
  it("is a container module named by its key", () => {
    expect(kindOf(OrdersModule)?.kind).toBe("module");
    expect(OrdersModule.key).toBe("orders");
    expect("service" in OrdersModule).toBe(false);
  });

  it("is imported by name and boots with no bindings", async () => {
    expect(kindOf(ConsoleModule)?.options["imports"]).toEqual([OrdersModule]);
    const container = await Container.create([], { roots: [ConsoleModule] });
    expect(container.instances()).toEqual([]);
  });

  it("refuses a key that is not snake_case", () => {
    expect(() => clientModule("Orders")).toThrow(RangeError);
  });
});
