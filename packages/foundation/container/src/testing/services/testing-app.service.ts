/**
 * Stackra file contract:
 * Purpose: `TestingApp`, what `createTestingModule(...).compile()` resolves to: the booted container read by class,
 *          the modules it booted, and `close()`; other packages' plugins add members (`app.events`, `app.workflows`).
 * Boundary: a thin face over `Container`; it never builds anything itself. Plugin members are declared on it by
 *           declaration merging and set by `compile()`.
 * Runtime: node
 * Governing contract: ADR 0263 (decision 12); ADR 0269 (decision 3).
 */
import type { Port } from "@stackra/contracts";

import type { AnyClass, Container, Named, NamedToken, Token } from "#core/index";
import type { ModuleRecord } from "#testing/types/module-record.type";

/**
 * A compiled testing module.
 *
 * @example
 * const app = await createTestingModule(LoyaltyKitModule).useDrivers("memory").compile();
 * app.get(LoyaltyService);
 * await app.close();
 */
export class TestingApp {
  /** The modules each root booted, in topological order. */
  readonly modules: readonly ModuleRecord[];

  /** The booted container. */
  private readonly container: Container;

  /**
   * @param container - the booted container.
   * @param modules - the modules each root booted.
   */
  constructor(container: Container, modules: readonly ModuleRecord[]) {
    this.container = container;
    this.modules = modules;
  }

  /** The instance for a class. */
  get<T extends object>(token: AnyClass<T>): T;

  /** The instance of `P` that config names `N`. */
  get<P extends Port, N extends string>(token: NamedToken<P, N>): Named<P, N>;

  /** Delegates either overload to the booted container. */
  get(token: Token): object {
    return this.container.get(token as AnyClass);
  }

  /** Whether the container binds `token`. */
  has(token: Token): boolean {
    return this.container.has(token);
  }

  /** Shuts down every instance the container built (database pools, timers). */
  async close(): Promise<void> {
    await this.container.close();
  }
}
