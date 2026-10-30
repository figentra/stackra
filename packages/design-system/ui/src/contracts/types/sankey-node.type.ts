/**
 * Stackra file contract:
 * Purpose: `SankeyNode`, one node of a sankey chart: a stage or bucket the flow passes through.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { ChartColor } from "#contracts/enums/chart-color.enum";

/** One node of a sankey chart. */
export interface SankeyNode {
  /** The key links name it by. */
  readonly key: string;
  /** The name shown beside the node. */
  readonly label: string;
  /** Its theme colour; the palette's, by position, by default. */
  readonly color?: ChartColor | undefined;
}
