/**
 * Stackra file contract:
 * Purpose: `NetworkNode`, one node of a network graph: a person, a service or a page the links join.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { ChartColor } from "#contracts/enums/chart-color.enum";

/** One node of a network graph. */
export interface NetworkNode {
  /** The key links name it by. */
  readonly key: string;
  /** The name shown under the node. */
  readonly label: string;
  /** The group it belongs to; nodes of a group share a colour. Without groups each node takes its own. */
  readonly group?: string | undefined;
  /** Its size; how many links it has by default. */
  readonly value?: number | undefined;
  /** Its theme colour; its group's (or its position's) in the palette by default. */
  readonly color?: ChartColor | undefined;
}
