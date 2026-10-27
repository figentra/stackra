/**
 * Stackra file contract:
 * Purpose: an R2 object's metadata as the cache reads it from `head` (size, upload time, custom metadata), typed
 *          structurally so the member needs no Workers type package.
 * Boundary: a type only.
 * Runtime: worker
 * Governing contract: ADR 0026 (decision 1: artifacts in R2).
 */

/** An R2 object's metadata, as `head` answers it. */
export interface TurboCacheObject {
  /** Bytes stored. */
  readonly size: number;
  /** When the object was written; older than the TTL setting is a miss. */
  readonly uploaded: Date;
  /** `tag` (turbo's artifact signature) and `duration` (task time in ms), as the upload sent them. */
  readonly customMetadata?: Record<string, string> | undefined;
}
