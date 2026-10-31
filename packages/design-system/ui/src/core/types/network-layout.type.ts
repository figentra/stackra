/**
 * Stackra file contract:
 * Purpose: `NetworkLayout`, a laid-out network graph in pixels: each node's centre and radius and each link's ends
 *          and weight (`networkLayoutOf`).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */
import type { NetworkLink } from "#contracts/types/network-link.type";
import type { NetworkNode } from "#contracts/types/network-node.type";

/** The nodes' circles and the links' lines. */
export interface NetworkLayout {
  /** Each node with its circle. */
  readonly nodes: readonly {
    readonly node: NetworkNode;
    /** The palette position: its group's order of first appearance, or its own position without groups. */
    readonly colorIndex: number;
    readonly x: number;
    readonly y: number;
    readonly radius: number;
    /** How many links it has. */
    readonly degree: number;
  }[];
  /** Each kept link with its line. */
  readonly links: readonly {
    readonly link: NetworkLink;
    readonly sourceIndex: number;
    readonly targetIndex: number;
    readonly x1: number;
    readonly y1: number;
    readonly x2: number;
    readonly y2: number;
    /** The stroke width. */
    readonly width: number;
  }[];
}
