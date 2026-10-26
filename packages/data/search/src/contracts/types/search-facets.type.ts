/**
 * Stackra file contract:
 * Purpose: `SearchFacets`, a facet answer: per filter path, each value as a string and how many matching rows hold it.
 * Boundary: a type only. A row counts once per value however often its document repeats it; a path with no value among
 *           the matching rows maps to an empty record. Values keep the order the driver ranked them in (most rows
 *           first, ties by value).
 * Runtime: isomorphic
 * Governing contract: ADR 0333 (amendment); ADR 0404.
 */

/** Path to value to row count. */
export type SearchFacets = Readonly<Record<string, Readonly<Record<string, number>>>>;
