/**
 * Stackra file contract:
 * Purpose: `MirrorOrdersProps`: props of `MirrorOrders`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12); ADR 0303 (props vocabulary).
 */

/** Props of {@link MirrorOrders}. */
export interface MirrorOrdersProps {
  /** The card's language, which also sets its direction: `en` left to right, `ar` right to left. */
  readonly locale: "en" | "ar";
  /** Reduced motion: the rows are drawn in place. */
  readonly isStill: boolean;
}
