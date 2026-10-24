/**
 * Stackra file contract:
 * Purpose: `Splash`, the native splash screen of a mobile app (`ThemingConfig.splash`): its background per scheme. Gen
 *          derives the splash image from `ThemingConfig.logo` and writes both into the Expo app config.
 * Boundary: a type only. An override merges the base value explicitly (`{ ...this.splash, background }`).
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decisions 4 and 5: gen writes the Expo config); ADR 0294 (decision 8).
 */
import type { SchemeColors } from "#core/types/scheme-colors.type";

/** The native splash screen. */
export interface Splash {
  /** The background colour per scheme. */
  readonly background: SchemeColors;
}
