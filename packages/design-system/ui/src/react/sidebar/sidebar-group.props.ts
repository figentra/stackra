/**
 * Stackra file contract:
 * Purpose: `SidebarGroupProps`, the props of the web `Sidebar.Group` in `sidebar-group.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); owner request 2026-10-29 (STA-1371).
 */
import type { ComponentPropsWithRef, ReactNode } from "react";

/** Props of the web Sidebar.Group: a labelled block of menus, optionally folding, plus a `div`'s own props. */
export type SidebarGroupProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  /** The group's heading. In the icon rail it becomes a thin rule and stays the group's spoken name. */
  readonly label?: string | undefined;
  /** A control at the end of the heading row, for example an IconButton that adds a project. Hidden in the rail. */
  readonly action?: ReactNode;
  /** True to let the heading fold the group away. Defaults to false. In the rail a group is always open. */
  readonly isCollapsible?: boolean | undefined;
  /** Whether a folding group is open, for a controlled group; pair it with `onOpenChange`. */
  readonly isOpen?: boolean | undefined;
  /** The starting open state of a folding group. Defaults to true. */
  readonly defaultOpen?: boolean | undefined;
  /** Called with the new state each time a folding group opens or closes. */
  readonly onOpenChange?: ((isOpen: boolean) => void) | undefined;
  /** The group's menus: usually one `Sidebar.Menu`. */
  readonly children?: ReactNode;
};
