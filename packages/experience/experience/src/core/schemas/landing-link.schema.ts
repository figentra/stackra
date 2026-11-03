/**
 * Stackra file contract:
 * Purpose: `LandingLink`, a link a landing block draws: its words and where it goes (the header's links and docs
 *          search, the CTA row's primary action).
 * Boundary: a shape class only, the field type of the landing blocks; gen compiles it with them.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0305 (one declaration per file); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";
import { Schema } from "@stackra/validation";

/** A link with its words. */
export class LandingLink extends Schema {
  label!: LocalizedText;

  href!: string;
}
