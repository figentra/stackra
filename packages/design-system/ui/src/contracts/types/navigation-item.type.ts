/**
 * Stackra file contract:
 * Purpose: one place the user can go, as the shell lists it: its key, text, optional icon, where it leads, whether it
 *          is the current place, a count or flag, and the places nested under it. Sidebar, NavigationList and TabBar
 *          all draw from a list of these, so an app declares its navigation once and both runtimes show it.
 * Boundary: types only. The component never decides which item is current: `@stackra/ui` is router-free (ADR 0303
 *           decision 1), so the app, or `@stackra/navigation`, sets `isCurrent` from the route. A phone tab bar reads
 *           only the first level; `children` are for the sidebar and the navigation list.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decisions 1 and 7); ADR 0317.
 */
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { IconSlot } from "#contracts/types/icon-slot.type";

/** One entry of the shell's navigation. */
export interface NavigationItem extends CollectionItem {
  /** The text of the entry; it is also its accessible name. */
  readonly label: string;
  /** Where the entry leads: an app path for the router, or an absolute URL. Left out, the entry only groups its `children`. */
  readonly href?: string | undefined;
  /** An icon drawn before the label: an icon name or any icon element. */
  readonly icon?: IconSlot | undefined;
  /** True for the entry the user is on; it is drawn selected and marked `aria-current="page"` (an ancestor is `true` too). */
  readonly isCurrent?: boolean | undefined;
  /** A count or short flag after the label, for example unread items; `0` and an empty string draw nothing. */
  readonly badge?: string | number | undefined;
  /** The entries nested under this one, in order; a phone tab bar leaves them out. */
  readonly children?: readonly NavigationItem[] | undefined;
  /** True to show the entry but refuse it, by pointer, touch and keyboard. */
  readonly isDisabled?: boolean | undefined;
  /** A shortcut shown in the entry's tooltip, as text to read (`G then O`); a hint only, the app binds the key. */
  readonly shortcut?: string | undefined;
  /** Called when the entry is chosen, before `href` is followed; an entry with only this is a press-only link. */
  readonly onPress?: (() => void) | undefined;
}
