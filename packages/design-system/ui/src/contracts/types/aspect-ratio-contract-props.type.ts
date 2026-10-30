/**
 * Stackra file contract:
 * Purpose: `AspectRatioContractProps`, the props every runtime's `AspectRatio` takes: a box that keeps a width to
 *          height ratio for media.
 * Boundary: types only; the box takes its parent's width, has the container radius and its child fills it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `AspectRatio`. */
export interface AspectRatioContractProps {
  /** The media, which fills the box: an image, a video or a map. */
  readonly children?: ReactNode;
  /** Width divided by height, for example `16 / 9`, `4 / 3` or `1`. Defaults to 1. */
  readonly ratio?: number | undefined;
}
