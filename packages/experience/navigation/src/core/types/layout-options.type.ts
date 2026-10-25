/**
 * Stackra file contract:
 * Purpose: `LayoutOptions`, what `Layout({...})` takes: the targets the frame is mounted on.
 * Boundary: a type only. A layout with no options is written bare (`extends Layout`).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 14 and 16).
 */
import type { Target } from "@stackra/contracts";

/** The options of a layout class. */
export interface LayoutOptions {
  /** The targets the layout is mounted on; every target of the app when left out. */
  readonly targets?: readonly Target[];
}
