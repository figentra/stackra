/**
 * Stackra file contract:
 * Purpose: `SidePanelHandleProps`, the props of `SidePanel.Handle` in `side-panel-handle.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); owner request 2026-10-29 (STA-1371, side panel).
 */
import type { ComponentPropsWithRef } from "react";

/** Props of SidePanel.Handle: a `div`'s props; the handle has no content of its own. */
export type SidePanelHandleProps = Omit<ComponentPropsWithRef<"div">, "children">;
