/**
 * Stackra file contract:
 * Purpose: `SidePanelBodyProps`, the props of `SidePanel.Body` in `side-panel-body.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); owner request 2026-10-29 (STA-1371, side panel).
 */
import type { ComponentPropsWithRef } from "react";

/** Props of SidePanel.Body: a `div`'s props. */
export type SidePanelBodyProps = ComponentPropsWithRef<"div">;
