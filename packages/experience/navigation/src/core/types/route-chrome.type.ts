/**
 * Stackra file contract:
 * Purpose: `RouteChrome`, a native route's chrome over the app's `ChromeConfig` (`Route({ chrome: { header } })`).
 * Boundary: a type only; what is left out comes from `ChromeConfig`.
 * Runtime: isomorphic
 * Governing contract: ADR 0165 (React Navigation on mobile); ADR 0294 (decision 16).
 */
import type { HeaderStyle } from "#core/enums/header-style.enum";

/** The chrome a route sets for its own screen. */
export interface RouteChrome {
  /** The header of this screen. */
  readonly header?: HeaderStyle;
}
