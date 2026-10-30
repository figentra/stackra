/**
 * Stackra file contract:
 * Purpose: `ContextMenuContractProps`, the props every runtime's `ContextMenu` takes: a menu that opens on a
 *          right-click (or Shift+F10 or the menu key) inside an area on web, and on a long press on native.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); WCAG 2.2 SC 2.1.1; STA-1371.
 */
import type { ReactNode } from "react";

import type { MenuSection } from "#contracts/types/menu-section.type";

/** Props shared by the web and native `ContextMenu`. */
export interface ContextMenuContractProps {
  /** The area that answers a right-click or a long press: a row, a card, a canvas. */
  readonly children: ReactNode;
  /** The actions, in groups. */
  readonly sections: readonly MenuSection[];
  /** The menu's accessible name, such as "Order actions". */
  readonly label: string;
  /** Called with the id of the chosen action, after its own `onPress`. */
  readonly onAction?: ((id: string) => void) | undefined;
  /** True to open no menu: on web the browser's own menu opens instead. */
  readonly isDisabled?: boolean | undefined;
}
