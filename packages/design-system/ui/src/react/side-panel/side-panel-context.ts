/**
 * Stackra file contract:
 * Purpose: `SidePanelContext`, the state of the nearest side panel, or null outside one.
 * Boundary: the context only; `SidePanel` provides it, its parts and `useSidePanel` read it.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); owner request 2026-10-29 (STA-1371, side panel).
 */
import { createContext } from "react";

import type { SidePanelApi } from "#react/side-panel/side-panel-api.type";

/** The side panel the reader sits in, or null outside any. */
export const SidePanelContext = createContext<SidePanelApi | null>(null);
