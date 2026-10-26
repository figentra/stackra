/**
 * Stackra file contract:
 * Purpose: `JsonPathValue`, the value `jsonPath` compares the value at a jsonb path with.
 * Boundary: a type only; JSON scalars, since a path filter matches one leaf (`jsonContains` matches a sub-document).
 * Runtime: node
 * Governing contract: ADR 0160 (decision 1).
 */

/** A JSON scalar. */
export type JsonPathValue = string | number | boolean | null;
