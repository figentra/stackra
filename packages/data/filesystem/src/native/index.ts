/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./native` entry of @stackra/filesystem (the Expo phone disk) until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names its one re-export and declares nothing. Phone only: it loads `expo-file-system`.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 15); ADR 0478; the STA-347 stand-in barrel decision.
 */
export { ExpoFileSystemDriver } from "#native/drivers/expo-file-system.driver";
