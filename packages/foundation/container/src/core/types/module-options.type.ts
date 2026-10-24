/**
 * Stackra file contract:
 * Purpose: `ModuleOptions`, what a module file may state: the classes it shares with sibling and host modules, and,
 *          on a root, the modules it imports.
 * Boundary: a type only. Everything else is derived by gen (the key from the folder, the bindings from the group
 *           folders, the edges from constructor types), so there is no providers list and no key option.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16 Module row); ADR 0305 (rules 15 and 16); ADR 0263 (decision 6).
 */
import type { AnyClass } from "#core/types/any-class.type";
import type { ModuleClass } from "#core/types/module-class.type";

/** The options of `Module({ ... })`. */
export interface ModuleOptions {
  /** The classes other modules may inject; the one fact gen cannot derive. */
  readonly exports?: readonly AnyClass[];

  /** On a root only: the modules it imports, narrowing or adding to the derived set. */
  readonly imports?: readonly ModuleClass[];
}
