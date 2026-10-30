/**
 * Stackra file contract:
 * Purpose: `useSidebarState`, the state machine behind `SidebarProvider` and a Sidebar drawn on its own: the collapsed
 *          state (controlled, uncontrolled, or kept in local storage), the phone drawer, the width, the peek, the
 *          filter text, the keyboard shortcut and keeping focus when the sidebar slides away.
 * Boundary: a hook; it renders nothing. Inside a Drawer the sidebar is never a drawer of its own. The shortcut is
 *           ignored while the user types in a field, where Cmd/Ctrl+B means bold.
 * Runtime: browser
 * Governing contract: ADR 0305; WCAG 2.2 SC 2.1.1, 2.1.4 and 2.4.3; owner request 2026-10-29 (STA-1371).
 */
import { use, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { LayoutBreakpoint } from "#contracts/enums/layout-breakpoint.enum";
import { readStored } from "#core/functions/read-stored.function";
import { writeStored } from "#core/functions/write-stored.function";
import { DrawerLayerContext } from "#react/drawer/drawer-layer-context";
import { usePaneWidth } from "#react/hooks/use-pane-width";
import type { SidebarState } from "#react/sidebar/sidebar-state.type";
import type { SidebarStateProps } from "#react/sidebar/sidebar-state-props.type";
import { useBreakpoint } from "#react/use-breakpoint/use-breakpoint";

/** True when the key event comes from a place the user types in. */
function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

/** The state of one sidebar, from its props. */
export function useSidebarState(
  {
    variant = "sidebar",
    collapsible = "icon",
    isCollapsed,
    defaultCollapsed = false,
    onCollapsedChange,
    isMobileOpen,
    defaultMobileOpen = false,
    onMobileOpenChange,
    collapseBelow = false,
    keyboardShortcut = "b",
    isExpandOnHover = false,
    isResizable = false,
    width,
    defaultWidth = 256,
    minWidth = 208,
    maxWidth = 400,
    onWidthChange,
    storageKey,
  }: SidebarStateProps,
  isProvided: boolean,
): SidebarState {
  const panelId = `sidebar-${useId().replaceAll(/[^a-zA-Z0-9]/gu, "")}`;
  const isInDrawer = use(DrawerLayerContext) !== null;
  const { breakpoint } = useBreakpoint();
  const isMobile =
    !isInDrawer &&
    collapseBelow !== false &&
    (breakpoint === undefined ||
      LayoutBreakpoint.indexOf(breakpoint) < LayoutBreakpoint.indexOf(collapseBelow));

  const collapsedKey = storageKey === undefined ? undefined : `${storageKey}:collapsed`;
  const [ownCollapsed, setOwnCollapsed] = useState(() => {
    const stored = readStored(collapsedKey);
    return stored === undefined ? defaultCollapsed : stored === "true";
  });
  const { width: currentWidth, setWidth } = usePaneWidth({
    width,
    defaultWidth,
    minWidth,
    maxWidth,
    onWidthChange,
    storageKey,
  });
  const [ownMobileOpen, setOwnMobileOpen] = useState(defaultMobileOpen);
  const [isPeeking, setPeeking] = useState(false);
  const [query, setQuery] = useState("");
  const refocus = useRef(false);

  const collapsed = collapsible !== "none" && (isCollapsed ?? ownCollapsed);
  const mobileOpen = isMobileOpen ?? ownMobileOpen;

  const setCollapsed = useCallback(
    (next: boolean) => {
      // Sliding away makes the panel inert, which drops focus on the body: hand it to a trigger outside instead.
      const panel = typeof document === "undefined" ? null : document.getElementById(panelId);
      refocus.current =
        next && collapsible === "offcanvas" && panel?.contains(document.activeElement) === true;
      setOwnCollapsed(next);
      writeStored(collapsedKey, String(next));
      if (!next) setPeeking(false);
      onCollapsedChange?.(next);
    },
    [panelId, collapsible, collapsedKey, onCollapsedChange],
  );
  const setMobileOpen = useCallback(
    (next: boolean) => {
      setOwnMobileOpen(next);
      onMobileOpenChange?.(next);
    },
    [onMobileOpenChange],
  );
  const toggle = useCallback(() => {
    if (isMobile) setMobileOpen(!mobileOpen);
    else if (collapsible !== "none") setCollapsed(!collapsed);
  }, [isMobile, mobileOpen, collapsible, collapsed, setMobileOpen, setCollapsed]);

  useEffect(() => {
    if (!refocus.current || !collapsed) return;
    refocus.current = false;
    const outside = [...document.querySelectorAll<HTMLElement>("[data-sidebar-trigger]")].find(
      (trigger) =>
        trigger.getAttribute("aria-controls") === panelId && !trigger.closest(`#${panelId}`),
    );
    outside?.focus();
  }, [collapsed, panelId]);

  useEffect(() => {
    if (keyboardShortcut === false || (collapsible === "none" && !isMobile)) return undefined;
    const key = keyboardShortcut.toLowerCase();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== key || !(event.metaKey || event.ctrlKey)) return;
      if (event.altKey || event.shiftKey || event.defaultPrevented || isTyping(event.target))
        return;
      event.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [keyboardShortcut, collapsible, isMobile, toggle]);

  const isRail = collapsed && collapsible === "icon" && !isMobile && !isPeeking;
  return useMemo<SidebarState>(
    () => ({
      panelId,
      isCollapsed: collapsed,
      setCollapsed,
      toggle,
      collapsible,
      variant,
      isMobile,
      isMobileOpen: mobileOpen,
      setMobileOpen,
      isRail,
      isPeeking,
      setPeeking,
      isExpandOnHover,
      width: currentWidth,
      setWidth,
      minWidth,
      maxWidth,
      isResizable,
      query,
      setQuery,
      isProvided,
    }),
    [
      panelId,
      collapsed,
      setCollapsed,
      toggle,
      collapsible,
      variant,
      isMobile,
      mobileOpen,
      setMobileOpen,
      isRail,
      isPeeking,
      isExpandOnHover,
      currentWidth,
      setWidth,
      minWidth,
      maxWidth,
      isResizable,
      query,
      isProvided,
    ],
  );
}
