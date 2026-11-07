/**
 * Stackra file contract:
 * Purpose: `Painter`, the colour functions of one run at its decided depth: a colour by hex, bold, dim, the theme's
 *          accent and the status colours. At depth 0 every function returns its text unchanged.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-017, FR-020 and FR-021.
 */

/** Colours text for one run. */
export interface Painter {
  /** `text` in `hex`. */
  readonly colour: (text: string, hex: string) => string;
  /** `text` in bold. */
  readonly bold: (text: string) => string;
  /** `text` in a dim colour. */
  readonly dim: (text: string) => string;
  /** `text` in the theme's accent. */
  readonly accent: (text: string) => string;
  /** `text` in the success colour. */
  readonly success: (text: string) => string;
  /** `text` in the warning colour. */
  readonly warning: (text: string) => string;
  /** `text` in the error colour. */
  readonly error: (text: string) => string;
}
