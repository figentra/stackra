/**
 * Stackra file contract:
 * Purpose: `FooterLink`, one link in a footer column: its words, where it goes, and whether it leaves the site.
 * Boundary: a type only, the field type of `FooterGroup`.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

/** A footer link. */
export interface FooterLink {
  /** The link's words. */
  readonly label: LocalizedText;

  /** Where the link goes. */
  readonly href: string;

  /** Whether the link leaves the site, so it opens in a new tab and says so. */
  readonly isExternal?: boolean;
}
