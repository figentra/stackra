/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/native-share (the configuration and its shipped schema, the
 *          driver base, the memory driver and the FileSystem and media helpers) until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names each re-export and declares nothing; it imports no React Native or Expo module, so web, desktop and
 *           tests load it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { NativeShareConfig } from "#config/native-share.config";
export {
  NATIVE_SHARE_CONFIG_SCHEMA,
  NATIVE_SHARE_CONFIG_SCHEMA as NativeShareConfig$,
} from "#core/constants/native-share-config-schema.constant";
export { IncomingShareDriver } from "#core/drivers/incoming-share.driver";
export { MemoryIncomingShareDriver } from "#core/drivers/memory-incoming-share.driver";
export { keepSharedItem } from "#core/functions/keep-shared-item.function";
export { sharedItemPath } from "#core/functions/shared-item-path.function";
export { uploadSharedItem } from "#core/functions/upload-shared-item.function";
export { NativeShareOptions } from "#core/schemas/native-share-options.schema";
