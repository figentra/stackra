/**
 * Stackra file contract:
 * Purpose: `SearchStackParamList`: the routes of the Search tab's stack (development builds only).
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 10); React Navigation static typing.
 */

/** The routes of the Search tab's stack (development builds only). */
export type SearchStackParamList = {
  /** The review area's search; deep link `stackra://search`. */
  Search: undefined;
};
