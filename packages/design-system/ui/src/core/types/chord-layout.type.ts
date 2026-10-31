/**
 * Stackra file contract:
 * Purpose: `ChordLayout`, a laid-out chord diagram: each group's arc on the ring and each flow's ribbon through the
 *          middle (`chordLayoutOf`).
 * Boundary: types only. Angles are radians clockwise from the top.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */
import type { SankeyLink } from "#contracts/types/sankey-link.type";
import type { SankeyNode } from "#contracts/types/sankey-node.type";

/** The groups' arcs and the flows' ribbons. */
export interface ChordLayout {
  readonly groups: readonly {
    readonly node: SankeyNode;
    /** Its position in the caller's nodes, which picks its colour. */
    readonly index: number;
    readonly start: number;
    readonly end: number;
    /** All that leaves it and reaches it. */
    readonly value: number;
    /** The ring slice's SVG path. */
    readonly path: string;
  }[];
  readonly ribbons: readonly {
    readonly link: SankeyLink;
    readonly sourceIndex: number;
    /** A closed SVG path from the source's arc, through the middle, to the target's arc and back. */
    readonly path: string;
  }[];
}
