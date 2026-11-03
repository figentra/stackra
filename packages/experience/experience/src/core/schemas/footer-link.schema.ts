/**
 * Stackra file contract:
 * Purpose: `FooterLink`, one link in a footer column: its words, where it goes, and whether it leaves the site.
 * Boundary: a shape class only, the field type of `FooterGroup`; gen compiles it with the footer block.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0305 (one declaration per file); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";
import { Schema } from "@stackra/validation";

/** A footer link. */
export class FooterLink extends Schema {
  label!: LocalizedText;

  href!: string;

  isExternal?: boolean;
}
