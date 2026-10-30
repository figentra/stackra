/**
 * Stackra file contract:
 * Purpose: `SidebarStateProps`, the web props that set up a sidebar's state: the shared contract's state props plus the
 *          web-only ones (the mobile breakpoint, the keyboard shortcut, expand-on-hover, the resizable width and the
 *          storage key). `SidebarProvider` takes them, and so does a `Sidebar` drawn without a provider.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); owner request 2026-10-29 (STA-1371, robust sidebar).
 */
import type { LayoutBreakpoint } from "#contracts/enums/layout-breakpoint.enum";
import type { SidebarContractProps } from "#contracts/types/sidebar-contract-props.type";

/** The state props of a web sidebar. */
export interface SidebarStateProps extends Pick<
  SidebarContractProps,
  | "variant"
  | "collapsible"
  | "isCollapsed"
  | "defaultCollapsed"
  | "onCollapsedChange"
  | "isMobileOpen"
  | "onMobileOpenChange"
> {
  /** The starting state of the phone drawer, for an uncontrolled drawer. Defaults to false. */
  readonly defaultMobileOpen?: boolean | undefined;
  /**
   * Below this breakpoint the sidebar is a drawer opened by `Sidebar.Trigger`; false keeps it in the page at every
   * width. Defaults to `md` under a `SidebarProvider` and to false for a Sidebar drawn on its own.
   */
  readonly collapseBelow?: LayoutBreakpoint | false | undefined;
  /** The key that toggles the sidebar with Cmd (macOS) or Ctrl, or false for none. Defaults to `b`. */
  readonly keyboardShortcut?: string | false | undefined;
  /** True to show a collapsed rail in full while the pointer rests on it, over the page. Defaults to false. */
  readonly isExpandOnHover?: boolean | undefined;
  /** True to let the user drag (or arrow-key) the rail to set the width. Defaults to false. */
  readonly isResizable?: boolean | undefined;
  /** The expanded width in pixels, for a controlled width; pair it with `onWidthChange`. */
  readonly width?: number | undefined;
  /** The starting expanded width in pixels. Defaults to 256 (16 rem). */
  readonly defaultWidth?: number | undefined;
  /** The narrowest width a drag reaches, in pixels. Defaults to 208. */
  readonly minWidth?: number | undefined;
  /** The widest width a drag reaches, in pixels. Defaults to 400. */
  readonly maxWidth?: number | undefined;
  /** Called with the new width in pixels after each resize. */
  readonly onWidthChange?: ((width: number) => void) | undefined;
  /**
   * A key under which the collapsed state and the width are kept in the browser's local storage, so they survive a
   * reload. Left out, nothing is stored.
   */
  readonly storageKey?: string | undefined;
}
