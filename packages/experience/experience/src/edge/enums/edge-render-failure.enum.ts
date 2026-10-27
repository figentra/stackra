/**
 * Stackra file contract:
 * Purpose: `EdgeRenderFailure`, why `renderEdgeDocument` gave up on a document: it is malformed or a node's props
 *          break its block's schema, it is over the render budget, or an edge block threw.
 * Boundary: an enum only. Every code means the same thing to the caller: serve the shell, let the browser render the
 *           page, and log the code with the document revision (ADR 0440, review point 6).
 * Runtime: isomorphic
 * Governing contract: ADR 0440 (edge render and its fallback); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/**
 * A reason the edge served the shell instead of the page.
 *
 * @example
 * if (!result.ok && result.reason === EdgeRenderFailure.OverBudget) log.warn("edge render over budget", result);
 */
export const EdgeRenderFailure = Enum.of({
  /** The document is not a node tree, or a node's props break its block's schema. */
  InvalidDocument: "invalid_document",
  /** Too deep, too many nodes, or too much HTML for the render budget. */
  OverBudget: "over_budget",
  /** An edge block threw, or has no generated schema. */
  BlockFailed: "block_failed",
});

/** One of the codes above. */
export type EdgeRenderFailure = Enum.Value<typeof EdgeRenderFailure>;
