/**
 * Stackra file contract:
 * Purpose: `StackContractProps`, the props every runtime's `Stack` takes: children in a column with an even gap from
 *          the spacing scale.
 * Boundary: types only; a layout primitive draws no landmark, heading or surface.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (owner request 2026-10-29, wave C).
 */
import type { ReactNode } from "react";

import type { Space } from "#contracts/enums/space.enum";

/** Props shared by the web and native `Stack`. */
export interface StackContractProps {
  /** The blocks, from top to bottom. */
  readonly children?: ReactNode;
  /** The space between blocks. Defaults to `md` (16px). */
  readonly gap?: Space | undefined;
  /** How each block sits across the column: `stretch` (full width, the default), `start`, `center` or `end`. */
  readonly align?: "stretch" | "start" | "center" | "end" | undefined;
}
