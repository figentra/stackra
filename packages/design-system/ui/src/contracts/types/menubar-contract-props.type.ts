/**
 * Stackra file contract:
 * Purpose: `MenubarContractProps`, the props of the `Menubar`: an application's bar of menus (File, Edit, View) with
 *          actions, dividers, section headings, checkable actions and shortcut hints, one handler for every action and
 *          one list of the checked actions across all menus.
 * Boundary: types only. Web only: a phone has no menubar, so native apps put these actions in a Menu or ActionMenu.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); WAI-ARIA menubar pattern; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { MenubarMenu } from "#contracts/types/menubar-menu.type";

/** Props of the `Menubar`. */
export interface MenubarContractProps {
  /** The menus, in order on the bar. */
  readonly menus: readonly MenubarMenu[];
  /** The keys of the checked actions across all menus, for a controlled menubar; pair it with `onChange`. */
  readonly value?: readonly string[] | undefined;
  /** The keys checked at the start, for an uncontrolled menubar. */
  readonly defaultValue?: readonly string[] | undefined;
  /** Called with the new list of checked keys each time a checkable action changes. */
  readonly onChange?: ((value: readonly string[]) => void) | undefined;
  /** Called with the key of every action chosen, after the action's own `onPress`. */
  readonly onAction?: ((id: string) => void) | undefined;
  /** The bar's accessible name. Defaults to the catalogue's "Application menu". */
  readonly "aria-label"?: string | undefined;
}
