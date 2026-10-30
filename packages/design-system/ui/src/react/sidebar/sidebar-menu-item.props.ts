/**
 * Stackra file contract:
 * Purpose: `SidebarMenuItemProps`, the props of the web `Sidebar.MenuItem` in `sidebar-menu-item.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); owner request 2026-10-29 (STA-1371).
 */
import type { ComponentPropsWithRef, ReactNode } from "react";

import type { IconSlot } from "#contracts/types/icon-slot.type";

/** Props of the web Sidebar.MenuItem: one place in a menu, plus the `li`'s own props. */
export type SidebarMenuItemProps = Omit<ComponentPropsWithRef<"li">, "children" | "onClick"> & {
  /** The text of the entry; also its spoken name, and its tooltip in the rail. */
  readonly label: string;
  /** An icon before the label: an icon name or any icon element. In the rail an entry without one shows a monogram. */
  readonly icon?: IconSlot | undefined;
  /** Where the entry leads, through the app's router (`RouterProvider`), or an absolute URL. */
  readonly href?: string | undefined;
  /** Called when the entry is chosen, before `href` is followed. */
  readonly onPress?: (() => void) | undefined;
  /** True for the place the user is on: drawn selected and announced with `aria-current="page"`. */
  readonly isActive?: boolean | undefined;
  /** True to show the entry but refuse it, by pointer, touch and keyboard. */
  readonly isDisabled?: boolean | undefined;
  /** A count or short flag after the label; a dot on the icon in the rail. `0` and an empty string draw nothing. */
  readonly badge?: string | number | undefined;
  /** A shortcut to show after the label as text to read (`G O`); a hint only, the app binds the key. */
  readonly shortcut?: string | undefined;
  /** A control at the end of the row, for example an ActionMenu; it shows on hover and focus. Hidden in the rail. */
  readonly action?: ReactNode;
  /** Whether the nested entries are shown, for a controlled sub-menu; pair it with `onOpenChange`. */
  readonly isOpen?: boolean | undefined;
  /** The starting state of the nested entries. Defaults to false, and to true when one of them is active. */
  readonly defaultOpen?: boolean | undefined;
  /** Called with the new state each time the nested entries are shown or hidden. */
  readonly onOpenChange?: ((isOpen: boolean) => void) | undefined;
  /** Nested `Sidebar.MenuItem`s: a sub-menu under this entry, drawn with an indent guide. */
  readonly children?: ReactNode;
};
