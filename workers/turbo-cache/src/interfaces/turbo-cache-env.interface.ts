/**
 * Stackra file contract:
 * Purpose: the Worker's environment: the R2 binding, the bearer-token secret and the four settings, all as strings
 *          the way wrangler hands `vars` and secrets in.
 * Boundary: types only; read-settings.ts turns the strings into `TurboCacheSettings`.
 * Runtime: worker
 * Governing contract: ADR 0026 (decisions 1 and 2); ADR 0009 (secrets).
 */
import type { TurboCacheBucket } from "./turbo-cache-bucket.interface";

/** What wrangler.jsonc binds and `wrangler secret put` sets. */
export interface TurboCacheEnv {
  /** The R2 bucket (`r2_buckets[].binding`). */
  readonly BUCKET: TurboCacheBucket;
  /** Worker secret: the bearer token turbo sends (Infisical `/ci` TURBO_TOKEN). Unset: every request is refused. */
  readonly TURBO_CACHE_TOKEN?: string | undefined;
  /** Largest artifact accepted, in bytes. */
  readonly TURBO_CACHE_MAX_ARTIFACT_BYTES?: string | undefined;
  /** Prefix of every R2 key. */
  readonly TURBO_CACHE_KEY_PREFIX?: string | undefined;
  /** Age after which an artifact is a miss, in seconds. */
  readonly TURBO_CACHE_TTL_SECONDS?: string | undefined;
  /** Most hashes one `POST /v8/artifacts` query may ask about. */
  readonly TURBO_CACHE_MAX_QUERY_HASHES?: string | undefined;
}
