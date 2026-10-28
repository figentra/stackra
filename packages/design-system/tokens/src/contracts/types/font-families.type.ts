/**
 * Stackra file contract:
 * Purpose: `FontFamilies`, part of the token schema of the Stackra Design System (see `Theme`): the font stacks, each
 *          a CSS `font-family` list. Three are required (sans, mono, arabic); the two display stacks, which the
 *          headings are set in, are optional and default to sans and arabic, so a brand switches its heading faces
 *          without restating its body faces (brand rules §33, STA-1386).
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0231 (design tokens: CSS property form).
 */
/** The font stacks, each a CSS `font-family` list. */
export interface FontFamilies {
  /** The stack for Latin text. */
  readonly sans: string;
  /** The stack for code, labels and figures. */
  readonly mono: string;
  /** The stack for Arabic (RTL) text. */
  readonly arabic: string;
  /** The stack for Latin headings and display text; `sans` when absent. Rendered as `--font-display`. */
  readonly display?: string;
  /** The stack for Arabic headings and display text; `arabic` when absent. Rendered as `--font-display-arabic`. */
  readonly displayArabic?: string;
}
