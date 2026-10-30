/**
 * Stackra file contract:
 * Purpose: `MenubarMenu`, one top-level menu of a `Menubar` ("File", "Edit", "View"): its name and its sections of
 *          actions, which may be checkable.
 * Boundary: types only; the actions are the `Menu`'s own `MenuSection`s.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); WAI-ARIA menubar pattern; STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import type { MenuSection } from "#contracts/types/menu-section.type";

/** One top-level menu of a menubar. */
export interface MenubarMenu {
  /** The menu's key, unique in the menubar. */
  readonly id: string;
  /** The menu's name on the bar, for example "File". */
  readonly label: string;
  /** The groups of actions, in order, with a divider between them. Action keys are unique across the menubar. */
  readonly sections: readonly MenuSection[];
  /** `single` or `multiple` to make this menu's actions checkable, one per section or any number. Defaults to `none`. */
  readonly selectionMode?: "none" | "single" | "multiple" | undefined;
}
