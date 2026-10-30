/**
 * Stackra file contract:
 * Purpose: `ComponentThumbnailProps`: props of `ComponentThumbnail`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12); showcase redesign spec section 5.
 */
import type { ComponentEntry } from "@stackra/showcase";

/** Props of {@link ComponentThumbnail}. */
export interface ComponentThumbnailProps {
  /** The entry whose `card` example (else its first) the thumbnail draws. */
  entry: ComponentEntry;
  /** How far the demo is scaled down: 0.75 (default) keeps its text readable; the micro chips pass less. */
  scale?: number | undefined;
}
