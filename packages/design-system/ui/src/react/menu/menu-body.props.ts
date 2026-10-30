/**
 * Stackra file contract:
 * Purpose: `MenuBodyProps`, the props of `MenuBody`: the sections, the selection and the action handler, plus HeroUI
 *          Dropdown menu props (`autoFocus`, data attributes) passed through.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); ADR 0302 (decision 3).
 */
import type { DropdownMenuProps } from "@heroui/react";

import type { MenuSection } from "#contracts/types/menu-section.type";

/** Props of MenuBody. */
export type MenuBodyProps = Omit<
  DropdownMenuProps<object>,
  "children" | "onAction" | "selectionMode" | "selectedKeys" | "onSelectionChange"
> & {
  /** The groups of actions, in order, with a divider between them. */
  readonly sections: readonly MenuSection[];
  /** `none`, `single` (one per section) or `multiple`. */
  readonly selectionMode: "none" | "single" | "multiple";
  /** The chosen keys across all sections. */
  readonly selected: readonly string[];
  /** Called with the new chosen keys. */
  readonly onSelectedChange: (next: readonly string[]) => void;
  /** Called with the key of every action chosen. */
  readonly onAction: (id: string) => void;
};
