/**
 * Stackra file contract:
 * Purpose: `SearchFilterValue`, a value a filter field of `@Searchable` holds, and the value a search asks it to hold.
 * Boundary: a type only. Filters compare exactly, never by text match; a date is stored and asked for as its ISO 8601
 *           string.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 1: hybrid search with filters).
 */

/** One filter value. */
export type SearchFilterValue = string | number | boolean;
