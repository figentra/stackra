/**
 * Stackra file contract:
 * Purpose: `RELATION_TYPES`, the relation field types of a model (`Ref<T>`, `Collection<T>`, `Link<T>`), which the
 *          shape compiler leaves to the entity emitter of the data wave.
 * Boundary: a frozen list of type names, matched when declared in a `@stackra/*` package.
 * Runtime: node
 * Governing contract: ADR 0294 (R11 and decision 28: relations and links).
 */

/** The relation type names. */
export const RELATION_TYPES: readonly string[] = Object.freeze(["Collection", "Link", "Ref"]);
