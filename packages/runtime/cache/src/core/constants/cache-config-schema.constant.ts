/**
 * Stackra file contract:
 * Purpose: `CACHE_CONFIG_SCHEMA`, the zod schema this package ships for `CacheConfig` (exported as `CacheConfig$`):
 *          the driver, the memory driver's entry bound, the Valkey server and key prefix, and the Workers KV binding.
 *          The `health` field tunes `CacheHealthIndicatorDriver` for `/readyz`.
 * Boundary: the stand-in for what gen writes for this package. Every field and every nested field has a default, so
 *           `.parse({})` gives the full defaults and a host's generated `CacheConfig$` extends it. The defaults equal
 *           `CacheOptions`' initializers (tested). `valkeyUrl` is the `CACHE_VALKEY_URL` secret, empty when unset.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0150 (decision 1, amended by ADR 0297
 *                     decision 3); ADR 0173 (no secret values in config).
 */
import { z } from "zod";

import { CACHE_DRIVERS } from "#core/constants/cache-drivers.constant";
import { HEALTH_CHECK_SCHEMA } from "#core/constants/health-check-schema.constant";

/** The shipped `CacheConfig$`. */
export const CACHE_CONFIG_SCHEMA = z.object({
  driver: z.enum(CACHE_DRIVERS).default("memory"),
  maxEntries: z.number().int().min(1).default(10_000),
  valkeyUrl: z.string().default(""),
  valkey: z
    .object({ keyPrefix: z.string().default("cache:") })
    .default(() => ({ keyPrefix: "cache:" })),
  workers: z
    .object({ binding: z.string().min(1).default("CACHE") })
    .default(() => ({ binding: "CACHE" })),
  health: HEALTH_CHECK_SCHEMA,
});
