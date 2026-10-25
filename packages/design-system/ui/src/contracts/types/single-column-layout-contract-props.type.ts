/**
 * Stackra file contract:
 * Purpose: the props every runtime's `SingleColumnLayout` takes: the frame of a detail page that has one column, its
 *          children (usually Sections) stacked with an even gap.
 * Boundary: types only. The layout draws no landmark and no heading: the page's `main` is the shell's and its `h1` the
 *           PageHeader's.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0317 (decision 7).
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `SingleColumnLayout`. */
export interface SingleColumnLayoutContractProps {
  /** The page's blocks, from top to bottom. */
  readonly children?: ReactNode;
}
