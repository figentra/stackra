/**
 * Stackra file contract:
 * Purpose: `RunnableMenu<V>`, a menu instance as its readers see it: a `Menu` with the author's `items(m)` method.
 * Boundary: a type only; `items` is not on the kind base (it would force `override`), so readers take this instead.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16).
 */
import type { Menu } from "#core/bases/menu.base";
import type { MenuBuilder } from "#core/types/menu-builder.type";
import type { MenuItem } from "#core/types/menu-item.type";

/** A menu whose items a renderer can read, for values of type `V`. */
export type RunnableMenu<V = unknown> = Menu & {
  /** The entries, in order. */
  items(m: MenuBuilder<V>): readonly MenuItem<V>[];
};
