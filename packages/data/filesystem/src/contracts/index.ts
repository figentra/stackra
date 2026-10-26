/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/filesystem (the `FileSystem` and `EncoreBucket` ports
 *          and the types they use) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package
 *           (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { EncoreBucket } from "#contracts/ports/encore-bucket.port";
export { FileSystem } from "#contracts/ports/file-system.port";
export type { FileStat } from "#contracts/types/file-stat.type";
export type { WriteOptions } from "#contracts/types/write-options.type";
export type { WriteStreamSource } from "#contracts/types/write-stream-source.type";
