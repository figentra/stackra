/**
 * Stackra file contract:
 * Purpose: `ThemeShadows`, part of the token schema of the Stackra Design System (see `Theme`): HeroUI's three surface
 *          shadows and the two elevation shadows (raised and pressed).
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0231 (design tokens: CSS property form).
 */
import type { ShadowToken } from "#contracts/types/shadow-token.type";

/** HeroUI's three surface shadows and the two elevation shadows. */
export interface ThemeShadows {
  /** Cards and other non-overlay surfaces, `--surface-shadow`. */
  readonly surface: ShadowToken;
  /** Popovers, dialogs and menus, `--overlay-shadow`. */
  readonly overlay: ShadowToken;
  /** Form fields, `--field-shadow`. */
  readonly field: ShadowToken;
  /** A control lifted off its track (a segment thumb, a completed step, a filled accent control), `--raised-shadow`. */
  readonly raised: ShadowToken;
  /** A control held down, `--pressed-shadow`. */
  readonly pressed: ShadowToken;
  /** Glass chrome, the action bar, toasts, `--floating-shadow`; the overlay shadow when left out. */
  readonly floating?: ShadowToken | undefined;
}
