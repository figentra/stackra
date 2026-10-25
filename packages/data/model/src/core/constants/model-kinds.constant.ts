/**
 * Stackra file contract:
 * Purpose: `MODEL_KINDS`, the kind codes of persisted classes, which are the kinds the relation decorators and the
 *          table facets (`@Index`, `@Searchable`) may mark.
 * Boundary: codes only. `model` is registered by `Model` here; `projection` is the persisted read model that
 *           @stackra/database registers (ADR 0294 decision 16), which has a table and indexes like a model; `model_addition` is an
 *           edition's side table of typed fields (ADR 0336). Internal: not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 6 and 16); ADR 0336 (decision 1); ADR 0231 (snake_case machine codes).
 */

/** The kind codes of classes that own a table. */
export const MODEL_KINDS: readonly string[] = Object.freeze([
  "model",
  "projection",
  "model_addition",
]);
