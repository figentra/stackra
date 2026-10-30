/**
 * Stackra file contract:
 * Purpose: `ComponentCardProps`: props of `ComponentCard`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12); showcase redesign spec section 5.
 */
import type { ComponentEntry } from "@stackra/showcase";

/** Props of {@link ComponentCard}. */
export interface ComponentCardProps {
  /** The entry the card shows. */
  entry: ComponentEntry;
  /** `md` (default) is the index card with a 16:10 preview pane; `sm` is a micro chip with the title under it. */
  size?: "sm" | "md" | undefined;
}
