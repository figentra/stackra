/**
 * Stackra file contract:
 * Purpose: `ModuleRecord`, one module a compiled testing module booted, as `app.modules` lists it: its key, its class
 *          when one exists, what it exports and what it depends on.
 * Boundary: a type only; `app.modules` lists the member's own modules of each root, in the wiring's topological
 *           order, not the modules merged from its dependencies.
 * Runtime: node
 * Governing contract: ADR 0263 (decisions 8 and 12); ADR 0269 (decision 3: the module builder lives in container).
 */
import type { AnyClass, ModuleClass } from "#core/index";

/** One booted module. */
export interface ModuleRecord {
  /** The module key (`orders`, `loyalty_kit`). */
  readonly key: string;

  /** The module class, when the wiring or the test names one. */
  readonly type: ModuleClass | undefined;

  /** The classes the module shares. */
  readonly exports: readonly AnyClass[];

  /** The keys of the modules it depends on. */
  readonly dependsOn: readonly string[];
}
