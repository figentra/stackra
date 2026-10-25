/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./native` entry of @stackra/identity (`ExpoSignInBrowserDriver`) until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names its one re-export and declares nothing. React Native only: it imports `expo-linking` and
 *           `expo-web-browser`, optional peers a mobile app installs.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 15); ADR 0206 (decision 8); the STA-347 stand-in barrel decision.
 */
export { ExpoSignInBrowserDriver } from "#native/drivers/expo-sign-in-browser.driver";
