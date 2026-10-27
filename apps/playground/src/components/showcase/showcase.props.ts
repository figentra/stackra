/**
 * Stackra file contract:
 * Purpose: `ShowcaseProps`: props of `Showcase`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { HeadingLevel } from "@stackra/ui/contracts";

/** Props of {@link Showcase}. */
export interface ShowcaseProps {
  /** The heading level of each scene's title. */
  headingLevel: HeadingLevel;
}
