/**
 * Stackra file contract:
 * Purpose: one action of a Menu or ActionMenu that does not open a submenu: its key, text, optional icon, second line
 *          and shortcut hint, its tone, whether it can be used and why not, and what it does when chosen (follow a
 *          link, or call a handler). The list of them is a section's `items`, so both runtimes draw the same actions
 *          from the same data.
 * Boundary: types only. `MenuItem` adds the submenu on top of this, and a submenu's own items are this type, so a menu
 *           nests one level (a deeper menu is a second screen, not a longer cascade).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary);
 *          ADR 0312.
 */
import type { Tone } from "@stackra/contracts";

import type { IconSlot } from "#contracts/types/icon-slot.type";

/** One action of a menu. */
export interface MenuLeafItem {
  /** The key the menu's selection and `onAction` report for this action; unique within the whole menu. */
  readonly id: string;
  /** The text of the action; it is also its accessible name and what type-ahead matches. */
  readonly label: string;
  /** A second, muted line under the label, for example what the action will do. */
  readonly description?: string | undefined;
  /** An icon drawn before the label: an icon name or any icon element. */
  readonly icon?: IconSlot | undefined;
  /**
   * A shortcut shown after the label, as text to read (`⌘E`, `Ctrl+E`). It is a hint only: the app binds the key
   * itself, and native leaves the hint out because a touch menu has no keyboard.
   */
  readonly shortcut?: string | undefined;
  /** `danger` colours a destructive action; every other tone reads as `default`. Defaults to `default`. */
  readonly tone?: Extract<Tone, "default" | "danger"> | undefined;
  /** True to show the action but refuse it, by pointer, touch and keyboard. */
  readonly isDisabled?: boolean | undefined;
  /** Why a disabled action is refused, drawn as its second line so keyboard and screen reader users read it too. */
  readonly disabledReason?: string | undefined;
  /**
   * Where choosing the action goes: an app path for the router (`/orders/ord_1`) or an absolute URL. The action is a
   * link on web; on native a path goes to the nearest `RouterProvider` and an absolute URL to the system browser.
   */
  readonly href?: string | undefined;
  /** Called when the action is chosen, before `href` is followed. */
  readonly onPress?: (() => void) | undefined;
}
