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
  readonly label: LocalizedText;

  readonly href: string;

  readonly isExternal?: boolean;
}
