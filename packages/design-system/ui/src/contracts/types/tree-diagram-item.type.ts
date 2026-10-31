/**
 * Stackra file contract:
 * Purpose: `TreeDiagramItem`, one node of a tree diagram and the nodes under it.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { ChartColor } from "#contracts/enums/chart-color.enum";

/** One node and its children, drawn one level further from the reading start. */
export interface TreeDiagramItem {
  /** A stable id, unique within the tree. */
  readonly key: string;
  /** The name shown beside the node. */
  readonly label: string;
  /** Its figure, read with its name; the sum of its children's when left out. */
  readonly value?: number | undefined;
  /** Its theme colour; a branch takes the palette's by position and its children share it. */
  readonly color?: ChartColor | undefined;
  /** The nodes under it. */
  readonly children?: readonly TreeDiagramItem[] | undefined;
}
