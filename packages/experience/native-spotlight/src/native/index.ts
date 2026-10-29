/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./native` entry of @stackra/native-spotlight (`ExpoDeviceSearchIndexDriver`), what
 *          gen lists as the candidate for the Expo target, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Loaded on a device only; the module type stays internal.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { ExpoDeviceSearchIndexDriver } from "#native/drivers/expo-device-search-index.driver";
