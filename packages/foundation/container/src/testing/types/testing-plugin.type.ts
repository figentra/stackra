/**
 * Stackra file contract:
 * Purpose: `TestingPlugin`, how another package's `./testing` entry extends the testing module without container
 *          importing it: builder methods (`.withConfig`, `.withSecrets`, `.withExtensions`, `.withConnection`,
 *          `.withIntegrationApi`, `.seed`, `.as`), members of the compiled app (`app.events`, `app.workflows`) and test
 *          drivers a test picks with `.useDrivers(...)` (the actions plugin's "memory" `AccessControl`).
 * Boundary: a type only. The plugin's package declares the same members on `TestingModuleBuilder` or `TestingApp` by
 *           declaration merging (`declare module "@stackra/container/testing"`), and registers the runtime half with
 *           `registerTestingPlugin` from its testing setup, which gen's vitest config loads.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); the STA-348 registry row (builder extension point).
 */
import type { WiringDriver } from "#core/index";
import type { TestingApp } from "#testing/services/testing-app.service";
import type { TestingModuleBuilder } from "#testing/services/testing-module-builder.service";

/** The runtime half of a testing-module extension. */
export interface TestingPlugin {
  /** The plugin's name, normally its package (`@stackra/config`); registering the same name again replaces it. */
  readonly name: string;

  /** Methods added to every `TestingModuleBuilder`, called with the builder as `this`; a chain method returns it. */
  readonly builder?: Readonly<
    Record<string, (this: TestingModuleBuilder, ...args: never[]) => unknown>
  >;

  /**
   * Driver candidates only a test can pick: a candidate joins its port's table when the test's `.useDrivers(...)`
   * names it for that port, so an unchosen one is never the port's only candidate. A registered wiring's candidate of
   * the same name wins.
   */
  readonly drivers?: readonly WiringDriver[];

  /** Members added to every compiled `TestingApp`, made from the app once it is compiled. */
  readonly app?: (app: TestingApp) => Readonly<Record<string, unknown>>;
}
