/**
 * Stackra file contract:
 * Purpose: `registerMenus(table)`, the generated route table's call that hands the app's menus (its own and its
 *          packages') to the registry a shell reads through `useMenus`.
 * Boundary: writes `MENU_REGISTRY`, all or nothing: a key that is not `snake_case` or a class that does not extend
 *           `Menu({...})` throws and registers none of the batch. Returns the disposer that takes exactly these entries
 *           back. Registering a key again replaces its class.
 * Runtime: isomorphic
 * Governing contract: ADR 0111 (decisions 1 and 3); ADR 0294 (decision 20); STA-1947.
 */
import { kindOf } from "@stackra/container";

import { MENU_REGISTRY } from "#core/constants/menu-registry.constant";
import type { MenuClass } from "#core/types/menu-class.type";

/** A menu key: `snake_case` segments. */
const MENU_KEY = /^[a-z][a-z0-9_]*$/;

/**
 * Registers each menu class under its key.
 *
 * @throws RangeError when a key is not `snake_case`.
 * @throws TypeError when a class does not extend `Menu({...})`.
 * @example
 * registerMenus(menuTable); // in the generated route table
 */
export function registerMenus(table: Readonly<Record<string, MenuClass>>): () => void {
  for (const [key, type] of Object.entries(table)) {
    if (!MENU_KEY.test(key)) throw new RangeError(`Menu key "${key}" is not snake_case`);
    if (kindOf(type)?.kind !== "menu")
      throw new TypeError(`${type.name} does not extend Menu({...})`);
  }
  for (const [key, type] of Object.entries(table)) MENU_REGISTRY.set(key, type);
  return () => {
    for (const [key, type] of Object.entries(table))
      if (MENU_REGISTRY.get(key) === type) MENU_REGISTRY.delete(key);
  };
}
