/**
 * Stackra file contract:
 * Purpose: `ChromeHeader`, the native header every screen starts from (`ChromeConfig.header`): its style, the glass
 *          blur and the back button's label.
 * Boundary: a type only, mutable like the zod output it is checked against; a route's `chrome` overrides the style.
 * Runtime: isomorphic
 * Governing contract: ADR 0165 (React Navigation on mobile); ADR 0305 (rule 34: configuration).
 */
import type { BackTitle } from "#core/enums/back-title.enum";
import type { HeaderStyle } from "#core/enums/header-style.enum";

/** The default native header. */
export interface ChromeHeader {
  /** The header style of a screen that sets none. */
  style: HeaderStyle;

  /** A transparent glass header on iOS 26. */
  blur: boolean;

  /** How the back button labels itself. */
  backTitle: BackTitle;
}
