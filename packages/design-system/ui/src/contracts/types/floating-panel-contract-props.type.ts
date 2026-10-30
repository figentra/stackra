/**
 * Stackra file contract:
 * Purpose: `FloatingPanelContractProps`, the props of the `FloatingPanel`: a non-modal window over the page (a chat, a
 *          tool palette, a preview) that people drag by its header, resize from its corner, minimise to its header
 *          and close, by pointer or keyboard, and that stays inside the viewport.
 * Boundary: types only. Web only: a phone has no room for a window beside the page, so native uses a Drawer.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.1.1 and 2.5.7; STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import type { ReactNode } from "react";

import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";

/** Props of the `FloatingPanel`. */
export interface FloatingPanelContractProps extends OpenStateContractProps {
  /** The panel's title in its header; it names the panel. */
  readonly title: string;
  /** The panel's content, which scrolls when it is taller than the panel. */
  readonly children: ReactNode;
  /** The starting width in pixels. Defaults to 360. */
  readonly defaultWidth?: number | undefined;
  /** The starting height in pixels. Defaults to 420. */
  readonly defaultHeight?: number | undefined;
  /** The narrowest the panel resizes to, in pixels. Defaults to 240. */
  readonly minWidth?: number | undefined;
  /** The shortest the panel resizes to, in pixels. Defaults to 160. */
  readonly minHeight?: number | undefined;
}
