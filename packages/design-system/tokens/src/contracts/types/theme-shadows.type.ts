/**
 * Stackra file contract:
 * Purpose: `ThemeShadows`, part of the token schema of the Stackra Design System (see `Theme`): the three HeroUI
 *          surface shadows.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0231 (design tokens: CSS property form).
 */
import type { ShadowToken } from "#contracts/types/shadow-token.type";

/** The three HeroUI surface shadows. */
export interface ThemeShadows {
  /** Cards and other non-overlay surfaces, `--surface-shadow`. */
  readonly surface: ShadowToken;
  /** Popovers, dialogs and menus, `--overlay-shadow`. */
  readonly overlay: ShadowToken;
  /** Form fields, `--field-shadow`. */
  readonly field: ShadowToken;
}
