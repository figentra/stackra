/**
 * Stackra file contract:
 * Purpose: `GroupCardProps`: props of `GroupCard`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12); showcase redesign spec section 5.
 */
import type { ComponentCategory } from "@stackra/showcase";

/** Props of {@link GroupCard}. */
export interface GroupCardProps {
  /** The category the card opens. */
  category: ComponentCategory;
}
