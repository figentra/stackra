/**
 * Stackra file contract:
 * Purpose: `FooterGroup`, one footer column: its title and its links.
 * Boundary: a type only, the field type of `SiteFooterBlock`.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

import type { FooterLink } from "#core/types/footer-link.type";

/** A footer column. */
export interface FooterGroup {
  /** The column's title. */
  readonly title: LocalizedText;

  /** The column's links, in order. */
  readonly links: FooterLink[];
}
