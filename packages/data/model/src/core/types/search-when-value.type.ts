/**
 * Stackra file contract:
 * Purpose: `SearchWhenValue`, a value `@Searchable`'s `when` condition compares a field with.
 * Boundary: a type only; a date field compares as its ISO 8601 string.
 * Runtime: isomorphic
 * Governing contract: ADR 0221; data-layer gap se9 (stackra-302).
 */

/** One value a `when` field may hold. */
export type SearchWhenValue = string | number | boolean;
