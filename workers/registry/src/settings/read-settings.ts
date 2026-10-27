/**
 * Stackra file contract:
 * Purpose: `readSettings`: the registry's settings from its vars.
 * Boundary: parsing only; the values and their defaults live in wrangler.jsonc.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 19).
 */
import type { RegistryEnv } from "#src/interfaces/registry-env.interface";
import type { RegistrySettings } from "#src/interfaces/registry-settings.interface";
import type { RetiredKey } from "#src/interfaces/retired-key.interface";
import type { VarValue } from "#src/interfaces/var-value.type";

/** A required string var. */
const text = (env: RegistryEnv, name: string): string => {
  const value: VarValue = env[`REGISTRY_${name}`];
  if (value === undefined || value === "") throw new RangeError(`REGISTRY_${name} is not set`);
  return String(value);
};

/** A required whole number var, at least `min` (1 unless zero is meaningful, as for grace days). */
const count = (env: RegistryEnv, name: string, min = 1): number => {
  const value = Number(text(env, name));
  if (!Number.isInteger(value) || value < min)
    throw new RangeError(`REGISTRY_${name} must be a whole number of at least ${min}`);
  return value;
};

/** The retired keys var: a JSON array of `{ key, expires }`. */
const retired = (env: RegistryEnv): RetiredKey[] => {
  const raw = env.REGISTRY_RETIRED_KEYS;
  const list: unknown = raw === undefined || raw === "" ? [] : JSON.parse(String(raw));
  if (!Array.isArray(list)) throw new RangeError("REGISTRY_RETIRED_KEYS must be a JSON array");
  return list.map((entry: { key?: unknown; expires?: unknown }) => {
    if (typeof entry.key !== "string" || typeof entry.expires !== "string")
      throw new RangeError("REGISTRY_RETIRED_KEYS entries need `key` and `expires`");
    return { key: entry.key, expires: entry.expires };
  });
};

/**
 * The registry's settings from its vars.
 *
 * @param env - the Worker environment.
 * @example
 * const settings = readSettings(env); // settings.maxTarballBytes === 52428800
 */
export function readSettings(env: RegistryEnv): RegistrySettings {
  const expires = env.REGISTRY_SIGNING_KEY_EXPIRES;
  return {
    host: text(env, "HOST"),
    maxTarballBytes: count(env, "MAX_TARBALL_BYTES"),
    maxUnpackedBytes: count(env, "MAX_UNPACKED_BYTES"),
    publishTokenSeconds: count(env, "PUBLISH_TOKEN_SECONDS"),
    tokenCacheSeconds: count(env, "TOKEN_CACHE_SECONDS"),
    licenceGraceDays: count(env, "LICENCE_GRACE_DAYS", 0),
    licenceMaxTokens: count(env, "LICENCE_MAX_TOKENS"),
    oidcIssuer: text(env, "OIDC_ISSUER"),
    oidcKeysSeconds: count(env, "OIDC_KEYS_SECONDS"),
    openPackumentMaxAge: count(env, "OPEN_PACKUMENT_MAX_AGE"),
    catalogueMaxLimit: count(env, "CATALOGUE_MAX_LIMIT"),
    licenceDocsUrl: text(env, "LICENCE_DOCS_URL"),
    signingKeyExpires: expires === undefined || expires === "" ? null : String(expires),
    retiredKeys: retired(env),
  };
}
