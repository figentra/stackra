/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./native` entry of @stackra/theming (`AppearanceSystemColorSchemeDriver`), the driver
 *          gen lists as the `SystemColorScheme` candidate for the native target, until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names its one re-export and declares nothing. Imports `./contracts` only. `useColorScheme` is the
 *           `./react` entry's on both runtimes, because it touches no platform API (one symbol, one entry).
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { AppearanceSystemColorSchemeDriver } from "#native/drivers/appearance-system-color-scheme.driver";
