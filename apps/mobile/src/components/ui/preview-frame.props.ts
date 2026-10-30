/**
 * Stackra file contract:
 * Purpose: `PreviewFrameProps`, the props of the showcase cards' live preview pane.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 5.
 */
import type { ReactNode } from "react";

/** The props of `PreviewFrame`. */
export interface PreviewFrameProps {
  /** The live demo, laid out in a frame 1/0.75 the pane's size and scaled down to fill it. */
  readonly children: ReactNode;
}
