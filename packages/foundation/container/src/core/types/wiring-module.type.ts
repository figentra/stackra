/**
 * Stackra file contract:
 * Purpose: `WiringModule`, one node of the module graph in a generated wiring: what the module exports, the modules
 *          it depends on, and, for a module merged from a dependency, the package it came from.
 * Boundary: a type only; gen writes the values in topological order (a module follows every module it depends on).
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (decisions 8 and 11); ADR 0294 (decision 16 Module row); ADR 0305 (rules 15 to 17).
 */
import type { AnyClass } from "#core/types/any-class.type";
import type { ModuleClass } from "#core/types/module-class.type";

/** One module of the graph, under its key in `Wiring.modules`. */
export interface WiringModule {
  /** The classes the module shares with the others. */
  readonly exports: readonly AnyClass[];

  /** The keys of the modules it depends on: inferred edges plus any `dependsOn`. */
  readonly dependsOn: readonly string[];

  /** The package a merged module came from; absent for the member's own modules. */
  readonly from?: string;

  /** The module class, when one exists (an authored module file or a generated `<Key>Module`). */
  readonly type?: ModuleClass;
}
