/**
 * Stackra file contract:
 * Purpose: `useSidePanel`, the state of the nearest side panel for the app's own controls: a toolbar button that opens
 *          it, a launcher input that opens it with a question.
 * Boundary: reads `SidePanelContext`; outside a SidePanel it throws, because a control with no panel to drive is a bug.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); owner request 2026-10-29 (STA-1371, side panel).
 */
import { use } from "react";

import type { SidePanelApi } from "#react/side-panel/side-panel-api.type";
import { SidePanelContext } from "#react/side-panel/side-panel-context";

// Developer text, read in the console only, so it stays English (ADR 0080 translates what users see).
const OUTSIDE = "useSidePanel must be called inside a SidePanel.";

/** The nearest side panel's state. */
export function useSidePanel(): SidePanelApi {
  const api = use(SidePanelContext);
  if (api === null) throw new Error(OUTSIDE);
  return api;
}
