/**
 * Stackra file contract:
 * Purpose: `SearchRelation`, one hop of a `@Searchable` facet's dotted path from the searched model to a related
 *          model: which parent's documents a change of the child makes stale, the relation path from the parent to
 *          the child, and the child fields those documents read.
 * Boundary: a type only, internal: `searchRelationsOf` derives it from the facet and the model's relation decorators,
 *           `registerSearchableModels` keeps it in `SEARCH_RELATIONS` and `RelatedChangeService` reads it.
 * Runtime: node
 * Governing contract: ADR 0221 (decision 5: indexing through the outbox); data-layer gap se4 (parent invalidation).
 */
import type { AnyClass } from "@stackra/container";

/** A related model whose changes reach a searched model's documents. */
export interface SearchRelation {
  /** The `@Searchable` model whose documents read the child. */
  readonly parent: AnyClass;

  /** The related model a dotted path walks to. */
  readonly child: AnyClass;

  /** The relation fields from the parent to the child (`["variants"]`, `["variants", "options"]`). */
  readonly via: readonly string[];

  /** The child's fields the parent's paths read next (`sku` of `variants.sku`) and its relation fields. */
  readonly reads: ReadonlySet<string>;
}
