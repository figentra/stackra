/**
 * Stackra file contract:
 * Purpose: `FooterLink`, one link in a `Footer`: its words, where it goes and whether it leaves the site.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (wave D, owner approval 2026-10-30).
 */

/** A footer link. */
export interface FooterLink {
  /** The link's words, for example "Shipping and returns". */
  readonly label: string;
  /** An app path or an absolute URL. */
  readonly href: string;
  /** True when it opens another site, in a new tab with the external mark. */
  readonly isExternal?: boolean | undefined;
}
