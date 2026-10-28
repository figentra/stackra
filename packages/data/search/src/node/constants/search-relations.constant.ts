/**
 * Stackra file contract:
 * Purpose: `SEARCH_RELATIONS`, the related models whose changes this process carries to their `@Searchable` parents,
 *          by the child's class name, the name a stored `RowChange` carries.
 * Boundary: process-wide and internal: written by `registerSearchableModels`, read by `RelatedChangeService`.
 * Runtime: node
 * Governing contract: ADR 0221 (decision 5); data-layer gap se4 (parent invalidation through relations).
 */
import type { SearchRelation } from "#node/types/search-relation.type";

/** Child model class name to the relations that read it. */
export const SEARCH_RELATIONS = new Map<string, readonly SearchRelation[]>();
