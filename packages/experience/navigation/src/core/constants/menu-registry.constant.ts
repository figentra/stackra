/**
 * Stackra file contract:
 * Purpose: `MENU_REGISTRY`, the menu classes an app composes, by menu key: its own and those its packages ship in their
 *          `react` and `native` entries, so a shell lists them without naming their classes.
 * Boundary: internal process state, written only by `registerMenus` (the generated route table's call).
 * Runtime: isomorphic
 * Governing contract: ADR 0111 (decisions 1 and 3: a module ships its menus, gen collects them); STA-1947.
 */
import type { MenuClass } from "#core/types/menu-class.type";

/** Menu key → menu class. */
export const MENU_REGISTRY = new Map<string, MenuClass>();
