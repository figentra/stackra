/**
 * Stackra file contract:
 * Purpose: what `resolveTheme` answers (ADR 0340 decision 2): accepted with the theme and its notices, or refused with
 *          the findings and suggestions.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decisions 2, 4 and 5).
 */
import type { ThemeAccepted } from "#contracts/types/theme-accepted.type";
import type { ThemeRefused } from "#contracts/types/theme-refused.type";

/** What `resolveTheme` answers. */
export type ThemeVerdict = ThemeAccepted | ThemeRefused;
