/**
 * Stackra file contract:
 * Purpose: `MonoDisplayProps`, what a page hands the MonoDisplay: the wordmark, a tagline and its art.
 * Boundary: an interface in its own file beside the component (ADR 0305). The wordmark is a name, never translated;
 *           the tagline is page copy.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0305 (`<name>.props.ts`); STA-2041.
 */

/**
 * The closing wordmark in mono.
 *
 * @example
 * <MonoDisplay title="stackra" tagline="One backend, every surface." art="glyphs" poster="/glyphs.png" />
 */
export interface MonoDisplayProps {
  /** The wordmark, such as `stackra`: a name, never translated, read left to right in every locale. */
  readonly title: string;
  /** A line under the wordmark. */
  readonly tagline?: string | undefined;
  /**
   * What stands with the wordmark: `floors`, three floors under it that rise bottom to top in floor steps; `glyphs`,
   * a code-glyph dither field behind it (it needs `poster`); or `none`. Defaults to `floors`.
   */
  readonly art?: "floors" | "glyphs" | "none" | undefined;
  /** The glyph field's poster image, which the edge render and print show; the `glyphs` art draws only with one. */
  readonly poster?: string | undefined;
  /** Styles the block. */
  readonly className?: string | undefined;
}
