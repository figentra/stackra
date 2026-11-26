/**
 * Stackra file contract:
 * Purpose: `AdrStatus`, the leading status of an ADR as its page description, an index row or the number register
 *          states it: the status word and, for a supersession, the superseding number.
 * Boundary: type only; `adrStatusOf` reads one from a status text.
 * Runtime: node
 * Governing contract: ADR template (apps/docs/src/docs/adr/template.mdx, status vocabulary); STA-2851.
 */

/** The leading status of an ADR. */
export type AdrStatus = {
  /** The status word in lower case: `accepted`, `proposed`, `deferred`, `rejected` or `superseded`. */
  readonly status: string;

  /** For `superseded`, the number of the ADR that replaces it, when the text names one. */
  readonly by?: string;
};
