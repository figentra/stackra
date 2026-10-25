/**
 * Stackra file contract:
 * Purpose: `createTestingModule`, the start of every container test: a module (or a set of modules to import) whose
 *          registered wiring a test boots, with its own overrides and drivers.
 * Boundary: builds the chain only; nothing boots until `.compile()`. The wirings come from `registerWiring`, which
 *           gen's vitest setup calls for the member and its dependencies.
 * Runtime: node
 * Governing contract: ADR 0263 (decision 12); ADR 0269 (decision 3).
 */
import type { ModuleClass } from "#core/index";
import { TestingModuleBuilder } from "#testing/services/testing-module-builder.service";

/**
 * A testing module for one module, or for the modules a test imports together.
 *
 * @example
 * const app = await createTestingModule(LoyaltyKitModule).useDrivers("memory").compile();
 * const app = await createTestingModule({ imports: [AccessLogModule, FixtureModule] }).compile();
 */
export function createTestingModule(
  root: ModuleClass | { readonly imports: readonly ModuleClass[] },
): TestingModuleBuilder {
  return new TestingModuleBuilder(typeof root === "function" ? [root] : root.imports);
}
