/**
 * Stackra file contract:
 * Purpose: `RegistryEnv`: the bindings, the secret and the vars of `stackra-registry`.
 * Boundary: types only; `readSettings` parses the vars.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 3, 9, 19); ADR 0173 (secrets).
 */
import type { D1Database } from "#src/interfaces/d1-database.interface";
import type { KvNamespace } from "#src/interfaces/kv-namespace.interface";
import type { R2Bucket } from "#src/interfaces/r2-bucket.interface";
import type { VarValue } from "#src/interfaces/var-value.type";

/** The bindings, the secret and the vars of `stackra-registry`. */
export interface RegistryEnv {
  readonly DB: D1Database;
  readonly TARBALLS: R2Bucket;
  readonly CACHE: KvNamespace;
  /** PKCS#8 PEM of the ECDSA P-256 signing key (Infisical `prod` `/registry`). */
  readonly REGISTRY_SIGNING_KEY: string;
  readonly [variable: `REGISTRY_${string}`]: VarValue;
}
