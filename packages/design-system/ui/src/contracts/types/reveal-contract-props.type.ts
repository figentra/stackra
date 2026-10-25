/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Reveal` takes: the content that enters, its place in a row revealed one after
 *          another, and whether it animates at all. Each runtime's `RevealProps` is this plus its view's own props.
 * Boundary: types only. The timing is the theme's `reveal` and `stagger` motion steps, never a prop, so every entrance
 *          moves alike; reduced motion always shows the content at once.
 * Runtime: isomorphic
 * Governing contract: ADR 0329 (motion layer); ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7).
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `Reveal`. */
export interface RevealContractProps {
  /** The content that fades in and rises into place. */
  readonly children: ReactNode;
  /**
   * Its place in a row revealed one after another, counted from 0: each place waits one `stagger` step longer.
   * Defaults to 0, no wait.
   */
  readonly index?: number | undefined;
  /** Off, the content shows at once with no motion. Defaults to on; the reduced-motion setting turns it off too. */
  readonly isAnimated?: boolean | undefined;
}
