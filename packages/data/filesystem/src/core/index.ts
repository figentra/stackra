/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/filesystem (the configuration, its shipped schema, the memory
 *          disk and the error every disk throws) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The shipped schema is re-exported under its generated name
 *           (`FilesystemConfig$`). The key checks and the driver-name list stay internal. The ports are
 *           `./contracts`'; the server drivers are `./node`'s; the Electron driver is `./electron`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { FilesystemConfig } from "#config/filesystem.config";
export { FILESYSTEM_CONFIG_SCHEMA as FilesystemConfig$ } from "#core/constants/filesystem-config-schema.constant";
export { MemoryFileSystemDriver } from "#core/drivers/memory-file-system.driver";
export { FileNotFoundError } from "#core/errors/file-not-found.error";
export { FilesystemOptions } from "#core/schemas/filesystem-options.schema";
