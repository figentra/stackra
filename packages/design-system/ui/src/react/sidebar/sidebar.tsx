/**
 * Stackra file contract:
 * Purpose: the web `Sidebar`: the console's side column of navigation. Drawn from `items` it stacks `startContent` (a
 *          brand or workspace switcher) beside its collapse toggle, an optional filter box, the places as groups and
 *          entries (the one `nav` landmark, scrolling when long) or loading rows, and `endContent` (the user menu);
 *          composed, it draws its parts: `Sidebar.Header`, `Sidebar.Content` with `Sidebar.Group`, `Sidebar.Menu` and
 *          `Sidebar.MenuItem`, `Sidebar.Footer` and `Sidebar.Rail`. It has three looks (`variant`: flush, floating,
 *          inset) and three collapse modes (`collapsible`: an icon rail with tooltips, sliding off the page, or none),
 *          optional expand-on-hover, a resizable width, the Cmd/Ctrl+B shortcut and a stored state. Below the mobile
 *          breakpoint it becomes a Drawer from the start edge.
 * Boundary: HeroUI has no sidebar; this is built on React Aria links and buttons, the house Drawer, Tooltip, Chip,
 *           SearchField and Skeleton. The state is a `SidebarProvider`'s when one is around it (so a trigger in the page
 *           header drives it), else its own. The width moves with `motion` full only, so `html[data-motion]` and the
 *           system's reduced motion stop it. Inside a Drawer (AppShell's) it is never a drawer of its own. It sits on
 *           the logical start edge and every side, edge and icon follows right-to-left.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0317 (decisions 1, 4 and 5); ADR 0060
 *          (right-to-left); ADR 0469 (clean-room); WCAG 2.2 SC 1.3.1, 2.1.1, 2.4.3, 2.5.8 and 4.1.2; owner request
 *          2026-10-29 (STA-1371, robust sidebar).
 */
import { cn } from "@heroui/react";
import {
  use,
  useRef,
  type CSSProperties,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import { filterNavigationItems } from "#core/functions/filter-navigation-items.function";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useMotion } from "#react/design-system-provider/use-motion";
import { Drawer } from "#react/drawer/drawer";
import { useUiText } from "#react/hooks/use-ui-text";
import { SidebarContent } from "#react/sidebar/sidebar-content";
import { SidebarContext } from "#react/sidebar/sidebar-context";
import { SidebarFooter } from "#react/sidebar/sidebar-footer";
import { SidebarGroup } from "#react/sidebar/sidebar-group";
import { SidebarHeader } from "#react/sidebar/sidebar-header";
import { SidebarInset } from "#react/sidebar/sidebar-inset";
import { SidebarItems } from "#react/sidebar/sidebar-items";
import { SidebarMenu } from "#react/sidebar/sidebar-menu";
import { SidebarMenuItem } from "#react/sidebar/sidebar-menu-item";
import { SidebarMenuSkeleton } from "#react/sidebar/sidebar-menu-skeleton";
import { SidebarProvider } from "#react/sidebar/sidebar-provider";
import { SidebarRail } from "#react/sidebar/sidebar-rail";
import { SidebarSearch } from "#react/sidebar/sidebar-search";
import { SidebarSeparator } from "#react/sidebar/sidebar-separator";
import { SidebarTrigger } from "#react/sidebar/sidebar-trigger";
import type { SidebarProps } from "#react/sidebar/sidebar.props";
import { useSidebarState } from "#react/sidebar/use-sidebar-state";

/** The icon rail's width in pixels: 4 rem, plus the 0.5 rem frame on each side of a floating or inset sidebar. */
const RAIL = { sidebar: 64, floating: 80, inset: 80 } as const;

/** The card each look draws the sidebar's content in. */
const CARD = {
  sidebar: "border-e border-separator bg-surface",
  floating: "rounded-[var(--radius-container)] border border-separator bg-surface shadow-sm",
  inset: "",
} as const;

/** How many placeholder rows stand in for the `items` while they load. */
const LOADING_ROWS = 6;

/** How long the pointer rests on a collapsed rail before it opens in full, in milliseconds. */
const PEEK_DELAY = 200;

/** The sidebar root. */
// oxlint-disable-next-line react/only-export-components -- the compound is Object.assign(Root, parts), so the export is the root function, which React Refresh takes as a component; the boundary holds (rule-gap B-6)
function SidebarRoot({
  items,
  label,
  startContent,
  endContent,
  isSearchable = false,
  isLoading = false,
  isCollapsible,
  variant,
  collapsible,
  isCollapsed,
  defaultCollapsed,
  onCollapsedChange,
  isMobileOpen,
  defaultMobileOpen,
  onMobileOpenChange,
  collapseBelow,
  keyboardShortcut,
  isExpandOnHover,
  isResizable,
  width,
  defaultWidth,
  minWidth,
  maxWidth,
  onWidthChange,
  storageKey,
  children,
  className,
  style,
  ...rest
}: SidebarProps): ReactElement {
  const t = useUiText();
  const motion = useMotion();
  const provided = use(SidebarContext);
  // Always called (hooks keep their order); a provider's state wins, and then this one binds no shortcut.
  const own = useSidebarState(
    {
      variant,
      collapsible: isCollapsible === false ? "none" : collapsible,
      isCollapsed,
      defaultCollapsed,
      onCollapsedChange,
      isMobileOpen,
      defaultMobileOpen,
      onMobileOpenChange,
      collapseBelow,
      keyboardShortcut: provided === null ? keyboardShortcut : false,
      isExpandOnHover,
      isResizable,
      width,
      defaultWidth,
      minWidth,
      maxWidth,
      onWidthChange,
      storageKey,
    },
    false,
  );
  const state = provided ?? own;
  const peek = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const look = state.variant;
  const isOffcanvas = state.collapsible === "offcanvas";
  const isAway = isOffcanvas && state.isCollapsed && !state.isMobile;

  let body: ReactNode = children;
  if (items !== undefined) {
    const shown = filterNavigationItems(items, state.query);
    const hasToggle = state.collapsible !== "none" && !state.isMobile;
    const hasHeader = startContent !== undefined || hasToggle || isSearchable;
    body = (
      <>
        {hasHeader ? (
          <SidebarHeader>
            <div className={cn("flex items-center gap-2", state.isRail ? "flex-col" : "")}>
              {startContent === undefined ? null : (
                <div className={cn("min-w-0", state.isRail ? "" : "flex-1")}>{startContent}</div>
              )}
              {hasToggle ? <SidebarTrigger className={state.isRail ? "" : "ms-auto"} /> : null}
            </div>
            {isSearchable ? <SidebarSearch /> : null}
          </SidebarHeader>
        ) : null}
        <SidebarContent {...(label === undefined ? {} : { label })}>
          {isLoading ? (
            <SidebarGroup>
              <span role="status" className="sr-only">
                {t(UI_KEYS.ui.sidebar.loading)}
              </span>
              <SidebarMenu>
                {Array.from({ length: LOADING_ROWS }, (_, index) => (
                  <SidebarMenuSkeleton key={index} />
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ) : shown.length === 0 && state.query !== "" ? (
            <p role="status" className="px-3 py-2 text-sm text-muted">
              {t(UI_KEYS.ui.sidebar.no_results)}
            </p>
          ) : (
            <SidebarItems items={shown} isFiltered={state.query !== ""} />
          )}
        </SidebarContent>
        {endContent === undefined ? null : <SidebarFooter>{endContent}</SidebarFooter>}
        {state.isResizable ? <SidebarRail /> : null}
      </>
    );
  }

  if (state.isMobile) {
    /** Closes the drawer when an entry inside it is chosen; a click on anything else leaves it open. */
    const closeOnEntry = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest("[data-navigation-item]"))
        state.setMobileOpen(false);
    };
    return (
      <SidebarContext value={state}>
        {/* A sidebar on its own has no header trigger to open it, so it leaves one in its place. */}
        {state.isProvided ? null : <SidebarTrigger />}
        <Drawer
          isOpen={state.isMobileOpen}
          onOpenChange={state.setMobileOpen}
          placement="start"
          size="sm"
          label={label ?? t(UI_KEYS.ui.app_shell.navigation)}
        >
          <Drawer.Body className="flex min-h-0 flex-col p-0">
            {/* The capture phase, because React Aria's press handling stops an entry's click from bubbling. */}
            {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- delegation only */}
            <div
              id={state.panelId}
              data-slot="sidebar-panel"
              className="flex min-h-0 flex-1 flex-col"
              onClickCapture={closeOnEntry}
            >
              {body}
            </div>
          </Drawer.Body>
        </Drawer>
      </SidebarContext>
    );
  }

  const canPeek = state.isExpandOnHover && state.isCollapsed && state.collapsible === "icon";
  const startPeek = () => {
    if (!canPeek) return;
    clearTimeout(peek.current);
    peek.current = setTimeout(() => state.setPeeking(true), PEEK_DELAY);
  };
  const endPeek = () => {
    clearTimeout(peek.current);
    if (state.isPeeking) state.setPeeking(false);
  };
  const outerWidth = state.isCollapsed ? (isOffcanvas ? 0 : RAIL[look]) : state.width;
  const moves = motion === "full";

  return (
    <SidebarContext value={state}>
      <div
        {...rest}
        data-slot="sidebar"
        data-state={state.isCollapsed ? "collapsed" : "expanded"}
        data-collapsed={state.isCollapsed ? "true" : undefined}
        data-collapsible={state.collapsible}
        data-variant={look}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") startPeek();
        }}
        onPointerLeave={endPeek}
        style={
          {
            ...style,
            width: outerWidth,
            "--sidebar-width": `${state.width}px`,
          } as CSSProperties
        }
        className={cn(
          "relative h-full shrink-0",
          moves
            ? "transition-[width] duration-200 ease-out motion-reduce:transition-none data-[resizing]:transition-none"
            : "",
          className,
        )}
      >
        <div
          id={state.panelId}
          data-slot="sidebar-panel"
          inert={isAway}
          className={cn(
            "absolute inset-y-0 start-0 flex",
            look === "sidebar" ? "" : look === "inset" ? "py-2 ps-2" : "p-2",
            state.isPeeking || isOffcanvas ? "w-[var(--sidebar-width)]" : "w-full",
            state.isPeeking ? "z-30" : "",
            isAway ? "-translate-x-full rtl:translate-x-full" : "translate-x-0",
            moves
              ? "transition-[translate,width] duration-200 ease-out motion-reduce:transition-none"
              : "",
          )}
        >
          <div
            data-slot="sidebar-inner"
            className={cn(
              "flex min-h-0 w-full flex-col overflow-hidden",
              CARD[look],
              state.isPeeking ? "shadow-xl" : "",
              state.isPeeking && look === "inset"
                ? "rounded-[var(--radius-container)] bg-surface"
                : "",
            )}
          >
            {body}
          </div>
        </div>
      </div>
    </SidebarContext>
  );
}

/** The parts of the compound. */
interface SidebarParts {
  /** The state owner and layout row; also exported as `SidebarProvider`. */
  readonly Provider: typeof SidebarProvider;
  /** The top block: the brand or a workspace switcher. */
  readonly Header: typeof SidebarHeader;
  /** The `nav` landmark that scrolls, holding groups and menus; the arrow keys move between entries. */
  readonly Content: typeof SidebarContent;
  /** A labelled block of menus, optionally folding, with an action at its heading's end. */
  readonly Group: typeof SidebarGroup;
  /** A list of entries. */
  readonly Menu: typeof SidebarMenu;
  /** One place: icon, label, badge, shortcut, action, active and disabled states, and a nested sub-menu. */
  readonly MenuItem: typeof SidebarMenuItem;
  /** A placeholder row while the menu loads. */
  readonly MenuSkeleton: typeof SidebarMenuSkeleton;
  /** A rule between blocks. */
  readonly Separator: typeof SidebarSeparator;
  /** The bottom block: usually the user menu. */
  readonly Footer: typeof SidebarFooter;
  /** The filter box. */
  readonly Search: typeof SidebarSearch;
  /** The strip on the inner edge: click to collapse, drag or arrow keys to resize. */
  readonly Rail: typeof SidebarRail;
  /** The toggle button, usable anywhere inside the provider. */
  readonly Trigger: typeof SidebarTrigger;
  /** The page beside the sidebar; a rounded card with the `inset` look. */
  readonly Inset: typeof SidebarInset;
}

/**
 * A side column of navigation. Draw it from `items`, or compose its parts as children; put it in a `SidebarProvider`
 * with a `Sidebar.Inset` to drive it from a `Sidebar.Trigger` in the page header and to have it become a drawer on a
 * phone. Collapse it with `isCollapsed` and `onCollapsedChange`, or leave it to `defaultCollapsed`.
 */
export const Sidebar: typeof SidebarRoot & SidebarParts = Object.assign(SidebarRoot, {
  Provider: SidebarProvider,
  Header: SidebarHeader,
  Content: SidebarContent,
  Group: SidebarGroup,
  Menu: SidebarMenu,
  MenuItem: SidebarMenuItem,
  MenuSkeleton: SidebarMenuSkeleton,
  Separator: SidebarSeparator,
  Footer: SidebarFooter,
  Search: SidebarSearch,
  Rail: SidebarRail,
  Trigger: SidebarTrigger,
  Inset: SidebarInset,
});
