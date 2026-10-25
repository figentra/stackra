/**
 * Stackra file contract:
 * Purpose: `TermsDocument`, one document a person accepts by version: its key, its current version, the hash of its
 *          current text, and whether the product cannot be used until it is accepted.
 * Boundary: a type only. The texts, versions and which documents a product requires are data the OS compliance
 *           service holds per market and language (owner round 3 #29); no document is named in code.
 * Runtime: isomorphic
 * Governing contract: owner round 3 #29; ADR 0298 (decision 3).
 */

/** A versioned document. */
export interface TermsDocument {
  /** The document key (`terms`, `privacy`, `dpa`). */
  readonly key: string;

  /** The current version. */
  readonly version: string;

  /** The hash of the current text, recorded with each acceptance. */
  readonly contentHash?: string;

  /** Use is blocked until this version is accepted. */
  readonly required: boolean;
}
