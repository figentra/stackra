/**
 * Stackra file contract:
 * Purpose: `RegistryEnv`: the bindings, the secret and the vars of `stackra-registry`.
 * Boundary: types only; `readSettings` parses the vars.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 3, 9, 19); ADR 0173 (secrets).
 */
import type { D1Database } from "#src/interfaces/d1-database.interface";
import type { KvNamespace } from "#src/interfaces/kv-namespace.interface";
import type { R2Bucket } from "#src/interfaces/r2-bucket.interface";
import type { VarValue } from "#src/interfaces/var-value.type";

/** The bindings, the secret and the vars of `stackra-registry`. */
export interface RegistryEnv {
  /** The D1 database binding that holds the registry tables. */
  readonly DB: D1Database;
  /** The R2 bucket binding that holds the tarballs. */
  readonly TARBALLS: R2Bucket;
  /** The KV namespace binding for the packument and OIDC key caches. */
  readonly CACHE: KvNamespace;
  /** PKCS#8 PEM of the ECDSA P-256 signing key (Infisical `prod` `/registry`). */
  readonly REGISTRY_SIGNING_KEY: string;
  readonly [variable: `REGISTRY_${string}`]: VarValue;
}
