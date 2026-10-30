/**
 * Stackra file contract:
 * Purpose: the web `SidePanel`: a panel that is a hidden part of the page, not an overlay. The root is the layout row
 *          and the state owner; `SidePanel.Inset` is the page and `SidePanel.Panel` the column at the end edge. Closed,
 *          the panel takes no width and an optional `SidePanel.Launcher` floats at the bottom centre; open, it is a
 *          column that pushes the page; expanded, it takes the whole row (the page behind it is inert). The state is
 *          controlled (`state`, `onStateChange`) or not (`defaultState`), the open width is resizable from
 *          `SidePanel.Handle` (pointer and keyboard) through the shared pane engine (`usePaneWidth`, `useResizeHandle`), and
 *          both are kept under `storageKey`.
 * Boundary: below `drawerBelow` (default `md`) there is no room to push, so the panel's parts are drawn in the house
 *           Drawer on the end edge instead (expanded is then the full-width drawer) and the Drawer owns focus; an
 *           uncontrolled panel starts shut there, so no page loads behind a modal. In the
 *           page, opening moves focus into the panel (`data-autofocus`, else the panel) unless `isFocusOnOpen` is
 *           false, and closing while focus is inside hands it back to the element that opened it (else the launcher).
 *           The end edge is logical, so in right-to-left the panel sits on the left. The width eases on the theme's
 *           curve at the `full` motion level only, and not during a drag.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0317; ADR 0060 (right-to-left); WAI-ARIA complementary
 *          landmark and window splitter; WCAG 2.2 SC 1.3.1, 2.1.1, 2.4.3 and 2.5.7; owner request 2026-10-29
 *          (STA-1371, side panel).
 */
import { cn } from "@heroui/react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactElement } from "react";

import { LayoutBreakpoint } from "#contracts/enums/layout-breakpoint.enum";
import { SidePanelState } from "#contracts/enums/side-panel-state.enum";
import { readStored } from "#core/functions/read-stored.function";
import { writeStored } from "#core/functions/write-stored.function";
import { usePaneWidth } from "#react/hooks/use-pane-width";
import type { SidePanelApi } from "#react/side-panel/side-panel-api.type";
import { SidePanelBody } from "#react/side-panel/side-panel-body";
import { SidePanelContext } from "#react/side-panel/side-panel-context";
import { SidePanelFooter } from "#react/side-panel/side-panel-footer";
import { SidePanelHandle } from "#react/side-panel/side-panel-handle";
import { SidePanelHeader } from "#react/side-panel/side-panel-header";
import { SidePanelInset } from "#react/side-panel/side-panel-inset";
import { SidePanelLauncher } from "#react/side-panel/side-panel-launcher";
import { SidePanelPanel } from "#react/side-panel/side-panel-panel";
import type { SidePanelProps } from "#react/side-panel/side-panel.props";
import { useBreakpoint } from "#react/use-breakpoint/use-breakpoint";

/** What can take focus inside the panel. */
const FOCUSABLE = "input, textarea, select, button, [href], [tabindex]:not([tabindex='-1'])";

/** A stored state, if it is one of the states. */
const stateOf = (value: string | undefined): SidePanelState | undefined =>
  SidePanelState.find((state) => state === value);

/** The layout row and state owner of one side panel. */
// oxlint-disable-next-line react/only-export-components -- the compound is Object.assign(Root, parts), so the export is the root function, which React Refresh takes as a component; the boundary holds (rule-gap B-6)
function SidePanelRoot({
  label,
  state,
  defaultState = "closed",
  onStateChange,
  width,
  defaultWidth = 432,
  minWidth = 320,
  maxWidth: maxWidthProp,
  variant = "attached",
  onWidthChange,
  storageKey,
  drawerBelow = "md",
  isFocusOnOpen = true,
  children,
  className,
  ...rest
}: SidePanelProps): ReactElement {
  // Half the window by default, so the page always keeps at least half; read once per render, not on every resize.
  const maxWidth =
    maxWidthProp ??
    Math.max(minWidth, typeof window === "undefined" ? 640 : Math.round(window.innerWidth / 2));
  const panelId = `side-panel-${useId().replaceAll(/[^a-zA-Z0-9]/gu, "")}`;
  const { breakpoint } = useBreakpoint();
  const isDrawer =
    drawerBelow !== false &&
    (breakpoint === undefined ||
      LayoutBreakpoint.indexOf(breakpoint) < LayoutBreakpoint.indexOf(drawerBelow));
  const stateKey = storageKey === undefined ? undefined : `${storageKey}:state`;
  // An uncontrolled panel that would start open on a small screen starts shut, so no page loads behind a modal.
  const [ownState, setOwnState] = useState(() =>
    isDrawer ? "closed" : (stateOf(readStored(stateKey)) ?? defaultState),
  );
  const { width: currentWidth, setWidth } = usePaneWidth({
    width,
    defaultWidth,
    minWidth,
    maxWidth,
    onWidthChange,
    storageKey,
  });
  const current = state ?? ownState;

  const setState = useCallback(
    (next: SidePanelState) => {
      setOwnState(next);
      writeStored(stateKey, next);
      onStateChange?.(next);
    },
    [stateKey, onStateChange],
  );

  // Focus follows the state however it changed (a launcher, the app's own button, a controlled prop), so it is moved
  // after the commit, when the panel is no longer inert.
  const previous = useRef(current);
  // A controlled panel the app starts open on a small screen would load the page behind a modal: wait for a change.
  const [isInitial, setInitial] = useState(true);
  const [first] = useState(current);
  if (isInitial && current !== first) setInitial(false);
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const was = previous.current;
    previous.current = current;
    if (was === current || isDrawer) return;
    const panel = document.getElementById(panelId);
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (was === "closed") {
      opener.current =
        active !== null && active !== document.body && panel?.contains(active) !== true
          ? active
          : null;
      if (isFocusOnOpen) {
        // A field component puts `data-autofocus` on its wrapper, so the focusable inside the marked element is the target.
        const marked = panel?.querySelector<HTMLElement>("[data-autofocus]");
        const target = marked?.matches(FOCUSABLE)
          ? marked
          : (marked?.querySelector<HTMLElement>(FOCUSABLE) ?? panel);
        target?.focus({ preventScroll: true });
      }
      return;
    }
    if (current !== "closed") return;
    // Inert drops a focused element's focus on the body: that counts as having been inside.
    if (active !== null && active !== document.body && panel?.contains(active) !== true) return;
    const back = opener.current?.isConnected === true ? opener.current : null;
    (
      back ?? document.querySelector<HTMLElement>(`[data-side-panel-launcher="${panelId}"] button`)
    )?.focus();
  }, [current, isDrawer, panelId, isFocusOnOpen]);

  const api = useMemo<SidePanelApi>(
    () => ({
      panelId,
      label,
      state: current,
      setState,
      width: currentWidth,
      setWidth,
      minWidth,
      maxWidth,
      isDrawer,
      isInitial,
      variant,
    }),
    [
      panelId,
      label,
      current,
      setState,
      currentWidth,
      setWidth,
      minWidth,
      maxWidth,
      isDrawer,
      isInitial,
      variant,
    ],
  );

  return (
    <SidePanelContext value={api}>
      <div
        {...rest}
        data-slot="side-panel-root"
        data-state={current}
        data-variant={variant}
        className={cn(
          "relative flex h-full min-h-0 w-full",
          // The split look: the page and the panel are two cards on the app's background, a gap around and between.
          variant === "split" && !isDrawer ? "bg-background p-2" : "",
          className,
        )}
      >
        {children}
      </div>
    </SidePanelContext>
  );
}

/** The parts of the compound. */
interface SidePanelParts {
  /** The page beside the panel: it is pushed when the panel opens and inert while the panel is expanded. */
  readonly Inset: typeof SidePanelInset;
  /** The panel column, a `complementary` landmark named by the SidePanel's `label`; a drawer on a small screen. */
  readonly Panel: typeof SidePanelPanel;
  /** The top row: a start slot, the panel's actions, and the built-in expand and close buttons. */
  readonly Header: typeof SidePanelHeader;
  /** The body, the only part that scrolls. */
  readonly Body: typeof SidePanelBody;
  /** The bottom row, for a composer or actions. */
  readonly Footer: typeof SidePanelFooter;
  /** The resize strip on the panel's start border: drag it, or focus it and use the arrow keys, Home and End. */
  readonly Handle: typeof SidePanelHandle;
  /** A floating bar at the bottom centre while the panel is closed; its title button opens the panel. */
  readonly Launcher: typeof SidePanelLauncher;
}

/**
 * A side panel that is part of the page: opening it pushes the page over, expanding it gives it the whole row. Put the
 * page in `SidePanel.Inset` and the panel's `Header`, `Body` and `Footer` (and a `Handle` to resize it) in
 * `SidePanel.Panel`; add a `SidePanel.Launcher` to open it from a floating bar.
 */
export const SidePanel: typeof SidePanelRoot & SidePanelParts = Object.assign(SidePanelRoot, {
  Inset: SidePanelInset,
  Panel: SidePanelPanel,
  Header: SidePanelHeader,
  Body: SidePanelBody,
  Footer: SidePanelFooter,
  Handle: SidePanelHandle,
  Launcher: SidePanelLauncher,
});
