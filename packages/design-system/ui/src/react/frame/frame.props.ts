/**
 * Stackra file contract:
 * Purpose: `FrameProps`, the props of the web `Frame` in `frame.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); ADR 0302 (decision 3); STA-2041 (owner Q2: 10 px frames).
 */
import type { ReactNode } from "react";

/** Props of the web Frame. */
export interface FrameProps {
  /**
   * The chrome around the content: a `window` with a title bar, a `schematic` window (a striped title bar on the
   * blueprint frame radius), a `phone`, or a `plain` border. Defaults to `window`.
   */
  readonly variant?: "window" | "schematic" | "phone" | "plain" | undefined;
  /** The window's title, address or file name, shown in its title bar; only `window` and `schematic` draw it. */
  readonly title?: string | undefined;
  /** A screenshot or a live widget. */
  readonly children: ReactNode;
  /** Lets the frame run past its parent's edge, which clips it: `bottom`, `end` or both. Defaults to `none`. */
  readonly bleed?: "none" | "bottom" | "end" | "bottom-end" | undefined;
  /** A pill switcher docked on the frame's bottom edge, such as a SegmentedControl of surfaces. */
  readonly tabs?: ReactNode;
  /** Styles the frame. */
  readonly className?: string | undefined;
}
