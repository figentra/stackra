/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./native` entry of @stackra/native-share (`ExpoIncomingShareDriver`) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing; it loads expo-sharing and React Native, so only a phone
 *           imports it.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 15); ADR 0478.
 */
export { ExpoIncomingShareDriver } from "#native/drivers/expo-incoming-share.driver";
