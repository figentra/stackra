/**
 * Stackra file contract:
 * Purpose: `STORES_CONFIG_SCHEMA`, the zod schema this package ships for `StoresConfig` (exported as `StoresConfig$`):
 *          the idempotency and rate-limit store drivers, and the Valkey server and key prefix they share.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults; they equal `StoresOptions`' initializers (tested). `valkeyUrl` is the `ACTIONS_VALKEY_URL`
 *           secret, empty when unset.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0173 (no secret values in config).
 */
import { z } from "zod";

import { STORE_DRIVERS } from "#core/constants/store-drivers.constant";

/** The shipped `StoresConfig$`. */
export const STORES_CONFIG_SCHEMA = z.object({
  idempotency: z.enum(STORE_DRIVERS).default("memory"),
  rateLimit: z.enum(STORE_DRIVERS).default("memory"),
  valkeyUrl: z.string().default(""),
  valkey: z
    .object({ keyPrefix: z.string().default("actions:") })
    .default(() => ({ keyPrefix: "actions:" })),
});
