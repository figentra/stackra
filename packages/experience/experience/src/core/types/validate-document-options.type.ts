/**
 * Stackra file contract:
 * Purpose: `ValidateDocumentOptions`, what `validateDocument` checks a document against: its kind, the block classes
 *          by key, and optional tighter bounds.
 * Boundary: a type only. On a server the blocks come from the generated block table (gen registers each block's
 *           schema with `@stackra/validation`), so no component is loaded; in a browser `registeredBlocks()` gives them.
 * Runtime: isomorphic
 * Governing contract: ADR 0110 (decision 4); ADR 0270 (decision 6).
 */
import type { ExperienceKind } from "#contracts/enums/experience-kind.enum";
import type { BlockClass } from "#core/types/block-class.type";

/** How a document is checked. */
export interface ValidateDocumentOptions {
  /** The document's kind; each block must fit it. */
  readonly kind: ExperienceKind;

  /** Every block class a document may name, by key. */
  readonly blocks: ReadonlyMap<string, BlockClass>;

  /** The deepest a node may sit, the root being 1; 32 when absent. */
  readonly maxDepth?: number;

  /** The most blocks a document may hold; 10,000 when absent. */
  readonly maxBlocks?: number;
}
