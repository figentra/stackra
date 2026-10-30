/**
 * Stackra file contract:
 * Purpose: the native `SidePanel`, an adapted form: a screen has no page column to push, so the panel is always the
 *          house Drawer on the end edge (a bottom sheet on a phone, a floating side panel on a tablet). `open` is the
 *          drawer's own width and `expanded` its full width; closing the drawer (a drag, the close button, the back
 *          gesture) moves the state to `closed`. The state is controlled (`state`, `onStateChange`) or not
 *          (`defaultState`). Its parts are the Drawer's.
 * Boundary: no width, resize, storage or launcher on native: the app opens it from its own button. Focus and the back
 *           gesture are the Drawer's.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0312; ADR 0317; owner request 2026-10-29 (STA-1371,
 *          side panel).
 */
import { useState, type ReactElement } from "react";

import type { SidePanelState } from "#contracts/enums/side-panel-state.enum";
import { Drawer } from "#native/drawer/drawer";
import type { SidePanelProps } from "#native/side-panel/side-panel.props";

/** The side panel on native: the end-edge drawer. */
// oxlint-disable-next-line react/only-export-components -- the compound is Object.assign(Root, parts), so the export is the root function, which React Refresh takes as a component (rule-gap B-6)
function SidePanelRoot({
  children,
  label,
  state,
  defaultState = "closed",
  onStateChange,
}: SidePanelProps): ReactElement {
  const [ownState, setOwnState] = useState<SidePanelState>(defaultState);
  const current = state ?? ownState;
  return (
    <Drawer
      isOpen={current !== "closed"}
      onOpenChange={(isOpen) => {
        const next = isOpen ? "open" : "closed";
        setOwnState(next);
        onStateChange?.(next);
      }}
      placement="end"
      size={current === "expanded" ? "full" : "sm"}
      label={label}
    >
      {children}
    </Drawer>
  );
}

/** The parts of the compound: the Drawer's own. */
interface SidePanelParts {
  /** The top row: the title and the close button. */
  readonly Header: typeof Drawer.Header;
  /** The title, which also names the panel. */
  readonly Title: typeof Drawer.Title;
  /** The body, the only part that scrolls. */
  readonly Body: typeof Drawer.Body;
  /** The bottom row. */
  readonly Footer: typeof Drawer.Footer;
}

/** A side panel: on native, the end-edge drawer; `expanded` draws it at full width. */
export const SidePanel: typeof SidePanelRoot & SidePanelParts = Object.assign(SidePanelRoot, {
  Header: Drawer.Header,
  Title: Drawer.Title,
  Body: Drawer.Body,
  Footer: Drawer.Footer,
});
