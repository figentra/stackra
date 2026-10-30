/**
 * Stackra file contract:
 * Purpose: `SankeyLayout`, a laid-out sankey chart in pixels: each node's box and each flow's band path (`sankeyLayoutOf`).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */
import type { SankeyLink } from "#contracts/types/sankey-link.type";
import type { SankeyNode } from "#contracts/types/sankey-node.type";

/** The nodes' boxes and the flows' bands. */
export interface SankeyLayout {
  readonly nodes: readonly {
    readonly node: SankeyNode;
    /** Its position in the caller's nodes, which picks its colour. */
    readonly index: number;
    readonly column: number;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    /** The larger of what flows in and what flows out. */
    readonly value: number;
  }[];
  readonly links: readonly {
    readonly link: SankeyLink;
    /** The source node's position, which picks the band's colour. */
    readonly sourceIndex: number;
    /** A closed SVG path of the band. */
    readonly path: string;
  }[];
  /** How many columns the nodes fill. */
  readonly columns: number;
}
