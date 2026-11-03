/**
 * Stackra file contract:
 * Purpose: `FooterGroup`, one footer column: its title and its links.
 * Boundary: a shape class only, the field type of `SiteFooterBlock`; gen compiles it with the block.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0305 (one declaration per file); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";
import { Schema } from "@stackra/validation";

import type { FooterLink } from "#core/schemas/footer-link.schema";

/** A footer column. */
export class FooterGroup extends Schema {
  title!: LocalizedText;

  links!: FooterLink[];
}
