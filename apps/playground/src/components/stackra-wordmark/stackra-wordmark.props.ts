/**
 * Stackra file contract:
 * Purpose: `StackraWordmarkProps`: props of `StackraWordmark`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */

/** Props of {@link StackraWordmark}. */
export interface StackraWordmarkProps {
  /** `fill` paints it solid; `outline` draws only a hairline edge, for the echoes behind the solid one. */
  variant?: "fill" | "outline";
  /** Sizing and colour classes. */
  className?: string;
}
