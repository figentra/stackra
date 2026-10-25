/**
 * Stackra file contract:
 * Purpose: `Catalogue`, the parsed content of one lang file, `assets/lang/<locale>/<namespace>.json`: nested objects
 *          whose leaves are ICU message strings.
 * Boundary: type only; deliberately loose (`unknown` values) so a JSON module import and a merged catalogue are both
 *           assignable. `formatMessage` checks what it reads.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (as amended by 0305 conventions 1), ADR 0234.
 */

/** One namespace's messages in one locale, nested by path segment. */
export type Catalogue = { readonly [segment: string]: unknown };
