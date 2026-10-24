/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/storage, the leaf entry of its port and the types the
 *          port's signature names, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf: it imports no other entry of this package. `Storage`
 *           is exported from here only, never from `.` (registry A3, ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { Storage } from "#contracts/ports/storage.port";
export type { StorageAreaHandle } from "#contracts/types/storage-area-handle.type";
export type { StorageWriteOptions } from "#contracts/types/storage-write-options.type";
export type { StoredRecord } from "#contracts/types/stored-record.type";
