/**
 * Stackra file contract:
 * Purpose: `DocsLink`, one link of a docs site's navbar or footer: its label and where it goes.
 * Boundary: a type only; `DocsConfig` holds these and `emitDocsSite` copies them into `docs.json` as they are.
 * Runtime: isomorphic
 * Governing contract: ADR 0002 (2026-10-27 amendment: `DocsConfig` replaces the hand-written `docs.json`); STA-1316.
 */

/** One navbar or footer link. */
export type DocsLink = {
  /** The text shown. */
  readonly label: string;

  /** An absolute URL, or a site path such as `/quickstart`. */
  readonly href: string;
};
