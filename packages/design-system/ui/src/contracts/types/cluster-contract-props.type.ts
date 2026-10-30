/**
 * Stackra file contract:
 * Purpose: `ClusterContractProps`, the props every runtime's `Cluster` takes: children in a row that wraps onto the
 *          next line when it runs out of room (tags, buttons, filters), with an even gap.
 * Boundary: types only; the row starts on the reading side, so it mirrors in right-to-left.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); STA-1371 (wave C).
 */
import type { ReactNode } from "react";

import type { Space } from "#contracts/enums/space.enum";

/** Props shared by the web and native `Cluster`. */
export interface ClusterContractProps {
  /** The items, in reading order. */
  readonly children?: ReactNode;
  /** The space between items, across and down. Defaults to `sm` (8px). */
  readonly gap?: Space | undefined;
  /** How items of different heights line up: `center` (the default), `start`, `end` or `baseline`. */
  readonly align?: "center" | "start" | "end" | "baseline" | undefined;
  /** Where each line's items sit: `start` (the default), `center`, `end` or `between` (spread to both ends). */
  readonly justify?: "start" | "center" | "end" | "between" | undefined;
}
