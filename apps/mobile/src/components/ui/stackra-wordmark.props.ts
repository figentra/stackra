/**
 * Stackra file contract:
 * Purpose: `StackraWordmarkProps`: props of `StackraWordmark`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */

/** Props of {@link StackraWordmark}. */
export interface StackraWordmarkProps {
  /** The colour, a resolved theme colour. */
  color: string;
  /** `fill` paints it solid; `outline` draws only a hairline edge, for the echoes around the solid one. */
  variant?: "fill" | "outline";
  /** The opacity of the paint, for the faint echoes. */
  opacity?: number;
}
