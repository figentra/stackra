/**
 * Stackra file contract:
 * Purpose: `DEFAULT_ACCESSIBILITY_SETTINGS`, the settings of a runtime that reports none: no reduced motion, no bold
 *          text, no high contrast and a font scale of 1. What a server renders and a hydrating client starts from.
 * Boundary: a frozen constant; a driver starts from it and replaces it once the system answers.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3, 2026-10-29 note); ADR 0266 (memory drivers first).
 */
import type { AccessibilitySettings } from "#contracts/types/accessibility-settings.type";

/** The settings before the system has answered, or where it has none. */
export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = Object.freeze({
  reduceMotion: false,
  boldText: false,
  highContrast: false,
  fontScale: 1,
});
