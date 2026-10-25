/**
 * Stackra file contract:
 * Purpose: `MenuOptions`, what `Menu({ kind })` takes: where the menu is shown.
 * Boundary: a type only; the items are the class's `items(m)` method, not an option.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 14 and 16).
 */
import type { MenuKind } from "#core/enums/menu-kind.enum";

/** The options of a menu class. */
export interface MenuOptions {
  /** Where the menu is shown. */
  readonly kind: MenuKind;
}
