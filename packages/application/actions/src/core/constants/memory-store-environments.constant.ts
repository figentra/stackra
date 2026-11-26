/**
 * Stackra file contract:
 * Purpose: `MEMORY_STORE_ENVIRONMENTS`, the environments where `StoresConfig` may select the `memory` idempotency
 *          and rate-limit stores: `dev` and `test`. Every deployed environment (`preview`, `staging`, `production`)
 *          refuses them at boot, because a memory store forgets every Idempotency-Key on a restart (a retried write
 *          runs twice) and keeps one set of token buckets per instance (the limit multiplies with the instances).
 * Boundary: read by `STORES_CONFIG_SCHEMA`'s refinement only. Internal to this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (decision 2); ADR 0136 (decision 3: the idempotency store); ADR 0217 (decision 2: the
 *                     rate limit); STA-2798.
 */
import { StoreEnvironment } from "#core/enums/store-environment.enum";

/** The environments that may keep the action stores in process memory. */
export const MEMORY_STORE_ENVIRONMENTS: readonly StoreEnvironment[] = Object.freeze([
  StoreEnvironment.Dev,
  StoreEnvironment.Test,
]);
