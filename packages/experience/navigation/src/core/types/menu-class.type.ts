/**
 * Stackra file contract:
 * Purpose: `MenuClass`, the class `Menu({ kind })` returns.
 * Boundary: a type only, one abstract construct signature with no parameters.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 25).
 */
import type { Menu } from "#core/bases/menu.base";

/** A menu kind base. */
export type MenuClass = abstract new () => Menu;
