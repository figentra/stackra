/**
 * Stackra file contract:
 * Purpose: `registeredBlocks()`, the read-only view of the blocks registered on this target: each key (a renamed
 *          block's old key too) to its block class, which the builder's palette and its props check take as
 *          `EditorOptions.blocks`.
 * Boundary: reads `BLOCK_ENTRIES` and returns a fresh copy, so a caller can never change the registry; the copy does
 *           not follow a later `registerBlocks` call. The components stay out: the builder draws through a renderer.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 3: the palette is code); ADR 0110 (decision 6); ADR 0294 (decision 22).
 */
import { BLOCK_ENTRIES } from "#core/constants/block-entries.constant";
import type { BlockClass } from "#core/types/block-class.type";

/**
 * Every registered block class by key, as registered so far.
 *
 * @example
 * const editor = Editor.create({ root: page.root, blocks: registeredBlocks() });
 */
export function registeredBlocks(): ReadonlyMap<string, BlockClass> {
  return new Map([...BLOCK_ENTRIES].map(([key, entry]) => [key, entry.block]));
}
