/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Menu` takes: the trigger as its one child, the sections of actions, the open
 *          state and placement every overlay shares, optional selection (scoped to a section) and one handler for
 *          every action chosen. Each runtime's `MenuProps` is this plus its HeroUI menu's own props, which pass
 *          through unchanged.
 * Boundary: types only. The menu dismisses itself on a choice, an outside press or Escape, so it takes no
 *           dismissal props, and it is named by its trigger, which therefore needs an accessible name.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); ADR 0312 (decision 4);
 *          ADR 0165 (UI contract).
 */
import type { ReactElement } from "react";

import type { MenuSection } from "#contracts/types/menu-section.type";
import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";
import type { PlacementContractProps } from "#contracts/types/placement-contract-props.type";

/** Props shared by the web and native `Menu`. The selection `value` is the list of chosen keys across all sections. */
export interface MenuContractProps extends OpenStateContractProps, PlacementContractProps {
  /** The element that opens the menu, usually a `Button` or `IconButton`; it must be pressable and named. */
  readonly children: ReactElement;
  /** The groups of actions, in order, with a divider between them. */
  readonly sections: readonly MenuSection[];
  /**
   * What choosing an action does: just run it (`none`, the default), or also keep it chosen, one per section
   * (`single`) or any number (`multiple`). A chosen action shows a mark and is reported in `onChange`.
   */
  readonly selectionMode?: "none" | "single" | "multiple" | undefined;
  /** The keys of the chosen actions, for a controlled menu; pair it with `onChange`. */
  readonly value?: readonly string[] | undefined;
  /** The keys chosen at the start, for an uncontrolled menu. */
  readonly defaultValue?: readonly string[] | undefined;
  /** Called with the new list of chosen keys each time the selection changes. */
  readonly onChange?: ((value: readonly string[]) => void) | undefined;
  /** Called with the key of every action chosen, after the action's own `onPress`. */
  readonly onAction?: ((id: string) => void) | undefined;
}
