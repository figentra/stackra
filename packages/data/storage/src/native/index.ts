/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./native` entry of @stackra/storage (`NativeStorageDriver`), the device driver gen
 *          lists as the `Storage` candidate for the mobile targets, until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names its one re-export and declares nothing. Imports `.` internals only; never loaded in a browser or on a
 *           server, because it needs react-native-mmkv and expo-secure-store.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note; the STA-347 stand-in barrel decision.
 */
export { NativeStorageDriver } from "#native/drivers/native-storage.driver";
