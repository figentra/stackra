/**
 * Stackra file contract:
 * Purpose: `SidePanelFooterProps`, the props of `SidePanel.Footer` in `side-panel-footer.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); owner request 2026-10-29 (STA-1371, side panel).
 */
import type { ComponentPropsWithRef } from "react";

/** Props of SidePanel.Footer: a `div`'s props. */
export type SidePanelFooterProps = ComponentPropsWithRef<"div">;
