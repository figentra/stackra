/**
 * Stackra file contract:
 * Purpose: `SidePanelPanelProps`, the props of `SidePanel.Panel` in `side-panel-panel.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); owner request 2026-10-29 (STA-1371, side panel).
 */
import type { ComponentPropsWithRef } from "react";

/** Props of SidePanel.Panel: an `aside`'s props; its name is the SidePanel's `label`. */
export type SidePanelPanelProps = Omit<ComponentPropsWithRef<"aside">, "aria-label">;
