/**
 * Stackra file contract:
 * Purpose: `GridContractProps`, the props every runtime's `Grid` takes: children in equal columns, either a fixed
 *          count or as many as fit at a minimum width, so cards reflow from one column on a phone to many on a desk.
 * Boundary: types only; cells fill in reading order, so the grid mirrors in right-to-left.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); STA-1371 (wave C).
 */
import type { ReactNode } from "react";

import type { Space } from "#contracts/enums/space.enum";

/** Props shared by the web and native `Grid`. */
export interface GridContractProps {
  /** The cells, in reading order. */
  readonly children?: ReactNode;
  /** The space between cells. Defaults to `md` (16px). */
  readonly gap?: Space | undefined;
  /** A fixed number of columns. Left out, `minItemWidth` decides; with neither, two columns. */
  readonly columns?: number | undefined;
  /** The narrowest a cell may be, in pixels: the grid fits as many columns as this allows, at least one. */
  readonly minItemWidth?: number | undefined;
}
