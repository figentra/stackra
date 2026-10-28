/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./native` entry of @stackra/theming (`AppearanceSystemColorSchemeDriver` and
 *          `AccessibilityInfoSystemAccessibilityDriver`), the drivers gen lists as the `SystemColorScheme` and
 *          `SystemAccessibility` candidates for the native target, until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `./contracts` only. `useColorScheme` and `useAccessibility` are the
 *           `./react` entry's on both runtimes, because it touches no platform API (one symbol, one entry).
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { AccessibilityInfoSystemAccessibilityDriver } from "#native/drivers/accessibility-info-system-accessibility.driver";
export { AppearanceSystemColorSchemeDriver } from "#native/drivers/appearance-system-color-scheme.driver";
