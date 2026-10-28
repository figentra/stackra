/**
 * Stackra file contract:
 * Purpose: `CACHE_CONFIG_SCHEMA`, the zod schema this package ships for `CacheConfig` (exported as `CacheConfig$`):
 *          the driver, the namespace, lock and metrics drivers, the memory driver's entry bound, the lifetime jitter,
 *          the cross-instance fill wait, the Valkey server and key prefix, the Postgres tables' schema and sweep size,
 *          and the Workers KV binding.
 *          The `health` field tunes `CacheHealthIndicatorDriver` for `/readyz`.
 * Boundary: the stand-in for what gen writes for this package. Every field and every nested field has a default, so
 *           `.parse({})` gives the full defaults and a host's generated `CacheConfig$` extends it. The defaults equal
 *           `CacheOptions`' initializers (tested). `valkeyUrl` is the `CACHE_VALKEY_URL` secret, empty when unset.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0150 (decision 1, amended by ADR 0297
 *                     decision 3); ADR 0173 (no secret values in config).
 */
import { Duration } from "@stackra/contracts";
import { z } from "zod";

import { CACHE_DRIVERS } from "#core/constants/cache-drivers.constant";
import { CACHE_LOCK_DRIVERS } from "#core/constants/cache-lock-drivers.constant";
import { CACHE_METRICS_DRIVERS } from "#core/constants/cache-metrics-drivers.constant";
import { CACHE_NAMESPACE_DRIVERS } from "#core/constants/cache-namespace-drivers.constant";
import { CACHE_DURATION_SCHEMA } from "#core/constants/cache-duration-schema.constant";
import { HEALTH_CHECK_SCHEMA } from "#core/constants/health-check-schema.constant";

/** A duration longer than zero: a zero fill wait would make the fill lock lapse at once. */
const POSITIVE_DURATION = CACHE_DURATION_SCHEMA.refine(
  (duration) => Duration.toMilliseconds(duration) > 0,
  {
    message: "must be longer than zero",
  },
);

/** The shipped `CacheConfig$`. */
export const CACHE_CONFIG_SCHEMA = z.object({
  driver: z.enum(CACHE_DRIVERS).default("memory"),
  namespace: z.enum(CACHE_NAMESPACE_DRIVERS).default("shared"),
  lock: z.enum(CACHE_LOCK_DRIVERS).default("local"),
  metrics: z.enum(CACHE_METRICS_DRIVERS).default("none"),
  maxEntries: z.number().int().min(1).default(10_000),
  jitter: z.number().min(0).max(1).default(0),
  fill: z
    .object({
      wait: POSITIVE_DURATION.default(Duration.seconds(5)),
      poll: POSITIVE_DURATION.default(Duration.parse("50ms")),
    })
    .default(() => ({ wait: Duration.seconds(5), poll: Duration.parse("50ms") })),
  valkeyUrl: z.string().default(""),
  valkey: z
    .object({ keyPrefix: z.string().default("cache:") })
    .default(() => ({ keyPrefix: "cache:" })),
  postgres: z
    .object({
      schema: z
        .string()
        .regex(/^[a-z][a-z0-9_]*$/, "a snake_case Postgres schema name")
        .default("cache"),
      sweep: z.number().int().min(0).max(10_000).default(100),
    })
    .default(() => ({ schema: "cache", sweep: 100 })),
  workers: z
    .object({ binding: z.string().min(1).default("CACHE") })
    .default(() => ({ binding: "CACHE" })),
  health: HEALTH_CHECK_SCHEMA,
});
