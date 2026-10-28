/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/theming (`useColorScheme` and `useAccessibility`) until `stackra gen` writes the
 *          entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` and `./contracts` only. The hooks serve React DOM and React Native
 *           alike, so the native app imports it from here too.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { useAccessibility } from "#react/accessibility/use-accessibility";
export { useColorScheme } from "#react/color-scheme/use-color-scheme";
