/**
 * Stackra file contract:
 * Purpose: the props every runtime's `SidePanel` takes: its state (closed, open or expanded; controlled or not) and its
 *          spoken name. Each runtime's `SidePanelProps` is this plus its own (the web adds the width, the storage key and
 *          the small-screen breakpoint).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0312 (controlled and uncontrolled state); ADR 0317; owner request
 *          2026-10-29 (STA-1371, side panel).
 */
import type { ReactNode } from "react";

import type { SidePanelState } from "#contracts/enums/side-panel-state.enum";

/** Props shared by the web and native `SidePanel`. */
export interface SidePanelContractProps {
  /** On web the page (`SidePanel.Inset`), the panel (`SidePanel.Panel`) and the launcher; on native the panel's parts. */
  readonly children: ReactNode;
  /** The panel's spoken name, for its `complementary` landmark (or its drawer), for example "Assistant". */
  readonly label: string;
  /** The state, for a controlled panel; pair it with `onStateChange`. */
  readonly state?: SidePanelState | undefined;
  /** The starting state of an uncontrolled panel. Defaults to `closed`. */
  readonly defaultState?: SidePanelState | undefined;
  /** Called with the new state each time the panel opens, expands, collapses back or closes. */
  readonly onStateChange?: ((state: SidePanelState) => void) | undefined;
}
