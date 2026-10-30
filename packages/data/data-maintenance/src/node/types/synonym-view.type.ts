/**
 * Stackra file contract:
 * Purpose: `SynonymView`, what the synonym actions and query answer for one set: its public id, index, language and terms.
 * Boundary: a type only; never the row, so no tenant id leaves the module.
 * Runtime: node
 * Governing contract: ADR 0492 (decision 5); ADR 0294 (decision 13).
 */
import type { PublicId } from "@stackra/contracts";

/** One synonym set as a caller sees it. */
export interface SynonymView {
  /** The set's public id. */
  readonly id: PublicId<"syn">;

  /** The index the set applies to. */
  readonly indexName: string;

  /** The language subtag the set applies to. */
  readonly language: string;

  /** The terms that find each other. */
  readonly terms: readonly string[];
}
