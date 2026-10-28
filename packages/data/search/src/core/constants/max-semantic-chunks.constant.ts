/**
 * Stackra file contract:
 * Purpose: `MAX_SEMANTIC_CHUNKS`, the most passages one semantic row is cut into: `semanticChunksOf` stops there and
 *          `passageIdsOf` reserves exactly this many ids per row, so a removal reaches every chunk.
 * Boundary: a constant. Raising it is safe (more slots); lowering it strands the chunks past the new cap until their
 *           rows are re-embedded, so lower it only with a reindex.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 1); stackra-301 (gap se8: the chunker).
 */

/** The most passages one row embeds into. */
export const MAX_SEMANTIC_CHUNKS = 16;
