/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/theming (the `SystemColorScheme` and
 *          `SystemAccessibility` ports, the `AccessibilitySettings` type and its defaults) until `stackra gen` writes
 *          the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package
 *           (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { DEFAULT_ACCESSIBILITY_SETTINGS } from "#contracts/constants/default-accessibility-settings.constant";
export { SystemAccessibility } from "#contracts/ports/system-accessibility.port";
export { SystemColorScheme } from "#contracts/ports/system-color-scheme.port";
export type { AccessibilitySettings } from "#contracts/types/accessibility-settings.type";
