/**
 * Stackra file contract:
 * Purpose: `searchPhraseWithheld`, whether a phrase may not be logged as text: it looks like an e-mail address or holds
 *          a run of six or more digits (a phone, an id or card number).
 * Boundary: pure, internal to this package; the PII check of the query log beside the model's data classes, which
 *           `SearchIndex` checks itself. It reads the raw phrase, before normalisation drops the `@`.
 * Runtime: isomorphic
 * Governing contract: ADR 0341 and ADR 0380 (data classes); data-layer gap se12 (stackra-326).
 */

/** An e-mail address, or six or more digits in a row, spaces and dashes between them allowed. */
const PERSONAL = /\S@\S|\d(?:[\s-]?\d){5,}/u;

/**
 * Whether `phrase` is withheld from the query log.
 *
 * @example
 * searchPhraseWithheld("sara@example.com"); // true
 * searchPhraseWithheld("linen shirt"); // false
 */
export function searchPhraseWithheld(phrase: string): boolean {
  return PERSONAL.test(phrase);
}
