/**
 * Stackra file contract:
 * Purpose: `EdgeRenderOptions`, what the edge Worker passes `renderEdgeDocument`: the visitor's locale, the published
 *          document's revision, the OS-registered edge blocks and, optionally, its own render budget.
 * Boundary: a type only. `blocks` is the whole set the edge may draw; any other key becomes a placeholder.
 * Runtime: isomorphic
 * Governing contract: ADR 0440; ADR 0297 (decision 3: cache the document by host, path and revision).
 */
import type { EdgeBlock } from "#edge/types/edge-block.type";

/** The options of one edge render. */
export interface EdgeRenderOptions {
  /** The visitor's locale (`ar-SA`). */
  readonly locale: string;

  /** The published document's revision, echoed in the result so a fallback is logged with it. */
  readonly revision: number;

  /** The OS-registered blocks the edge draws. */
  readonly blocks: readonly EdgeBlock[];

  /** The render budget; each bound left out keeps its `EDGE_RENDER_LIMITS` default. */
  readonly limits?: Partial<{
    readonly maxDepth: number;
    readonly maxNodes: number;
    readonly maxBytes: number;
  }>;
}
