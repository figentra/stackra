/**
 * Stackra file contract:
 * Purpose: `LandingLink`, a link a landing block draws: its words and where it goes (the header's links and docs
 *          search, the CTA row's primary action).
 * Boundary: a type only, the field type of the landing blocks.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

/** A link with its words. */
export interface LandingLink {
  /** The link's words. */
  readonly label: LocalizedText;

  /** Where the link goes. */
  readonly href: string;
}
