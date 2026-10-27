/**
 * Stackra file contract:
 * Purpose: `ActionClass`, what `Action({...})` returns: the abstract base an action class extends.
 * Boundary: a type only. Its constructor takes nothing; a subclass declares its dependencies as constructor parameters
 *           and calls `super()`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 25).
 */
import type { Action } from "#core/bases/action.base";

/** The base class of one action. */
export type ActionClass = abstract new () => Action;
