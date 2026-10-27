/**
 * Stackra file contract:
 * Purpose: the cache's settings once read and checked from the environment.
 * Boundary: a type only; read-settings.ts builds it, handle-request.ts reads it.
 * Runtime: worker
 * Governing contract: ADR 0026; configuration not code (the batch rules).
 */

/** The checked settings and the token. */
export interface TurboCacheSettings {
  /** The bearer token every request must carry. */
  readonly token: string;
  /** Largest artifact accepted, in bytes (a positive integer). */
  readonly maxArtifactBytes: number;
  /** Prefix of every R2 key (may be empty). */
  readonly keyPrefix: string;
  /** Age after which an artifact is a miss, in seconds (a positive integer). */
  readonly ttlSeconds: number;
  /** Most hashes one `POST /v8/artifacts` query may ask about (a positive integer). */
  readonly maxQueryHashes: number;
}
