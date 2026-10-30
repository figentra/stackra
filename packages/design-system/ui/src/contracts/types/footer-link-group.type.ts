/**
 * Stackra file contract:
 * Purpose: `FooterLinkGroup`, one column of a `Footer`: a heading and its links.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { FooterLink } from "#contracts/types/footer-link.type";

/** A footer column. */
export interface FooterLinkGroup {
  /** The column's heading, for example "Help". */
  readonly title: string;
  /** Its links, top to bottom. */
  readonly links: readonly FooterLink[];
}
