/**
 * Stackra file contract:
 * Purpose: `CACHE_CONFIG_SCHEMA`, the zod schema this package ships for `CacheConfig` (exported as `CacheConfig$`):
 *          the memory driver's entry bound.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults and a host's generated `CacheConfig$` extends it. The defaults equal `CacheOptions`'
 *           initializers (tested).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0150 (decision 1).
 */
import { z } from "zod";

/** The shipped `CacheConfig$`. */
export const CACHE_CONFIG_SCHEMA = z.object({
  maxEntries: z.number().int().min(1).default(10_000),
});
