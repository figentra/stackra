/**
 * Stackra file contract:
 * Purpose: `SidePanelInsetProps`, the props of `SidePanel.Inset` in `side-panel-inset.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); owner request 2026-10-29 (STA-1371, side panel).
 */
import type { ComponentPropsWithRef } from "react";

/** Props of SidePanel.Inset: a `div`'s props. */
export type SidePanelInsetProps = ComponentPropsWithRef<"div">;
