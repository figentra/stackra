/**
 * Stackra file contract:
 * Purpose: `RevertTargets`, the targets a workbook import's revert hands each batch to: sheet name to target.
 * Boundary: a type only. It names every sheet the run wrote; a single-sheet run passes its one target instead.
 * Runtime: isomorphic
 * Governing contract: ADR 0431 (decision 1); ADR 0367 (decision 8).
 */
import type { ImportTarget } from "#contracts/types/import-target.type";

/** Sheet name to the target its batches are reverted through. */
export type RevertTargets = Readonly<Record<string, ImportTarget<unknown>>>;
