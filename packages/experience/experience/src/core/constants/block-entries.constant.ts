/**
 * Stackra file contract:
 * Purpose: `BLOCK_ENTRIES`, the blocks registered on this target by key, a renamed block also under its old key.
 * Boundary: written only by `registerBlocks`, read by `resolveDocument` and copied out by `registeredBlocks`. Not
 *           exported from an entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0110 (decision 6: unknown keys are refused); ADR 0294 (decision 22: `@Renamed`).
 */
import type { BlockEntry } from "#core/types/block-entry.type";

/** Registered blocks by key (`web.hero_section`). */
export const BLOCK_ENTRIES = new Map<string, BlockEntry>();
