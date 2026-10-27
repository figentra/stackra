/**
 * Stackra file contract:
 * Purpose: `readSettings(env)`, the cache's settings checked from the Worker environment: the bearer token secret, the
 *          largest artifact, the R2 key prefix, the TTL and the most hashes one query may ask about.
 * Boundary: pure; reads only the strings it is handed. `undefined` when the token is missing or empty or a number
 *           setting is missing or not a positive integer, so the handler fails closed (503) instead of guessing.
 * Runtime: worker
 * Governing contract: ADR 0026; configuration not code (the batch rules).
 */
import type { TurboCacheEnv, TurboCacheSettings } from "#src/interfaces";

/** A positive integer written in decimal, or `undefined`. */
const positiveInteger = (value: string | undefined): number | undefined => {
  if (value === undefined || !/^[1-9]\d*$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
};

/**
 * The checked settings, or `undefined` when any is missing or invalid.
 *
 * @example
 * const settings = readSettings(env);
 * if (settings === undefined) return new Response(null, { status: 503 });
 */
export function readSettings(env: TurboCacheEnv): TurboCacheSettings | undefined {
  const token = env.TURBO_CACHE_TOKEN;
  const maxArtifactBytes = positiveInteger(env.TURBO_CACHE_MAX_ARTIFACT_BYTES);
  const ttlSeconds = positiveInteger(env.TURBO_CACHE_TTL_SECONDS);
  const maxQueryHashes = positiveInteger(env.TURBO_CACHE_MAX_QUERY_HASHES);
  const keyPrefix = env.TURBO_CACHE_KEY_PREFIX;
  if (
    token === undefined ||
    token === "" ||
    maxArtifactBytes === undefined ||
    ttlSeconds === undefined ||
    maxQueryHashes === undefined ||
    keyPrefix === undefined
  )
    return undefined;
  return { token, maxArtifactBytes, keyPrefix, ttlSeconds, maxQueryHashes };
}
