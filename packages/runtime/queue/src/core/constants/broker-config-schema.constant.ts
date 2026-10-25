/**
 * Stackra file contract:
 * Purpose: `BROKER_CONFIG_SCHEMA`, the zod schema this package ships for `BrokerConfig` (exported as `BrokerConfig$`):
 *          which broker publisher runs, and the Valkey server, key prefix and stream length of the `valkey` driver.
 * Boundary: the stand-in for what gen writes for this package. Every field and nested field has a default, so
 *           `.parse({})` gives the full defaults; they equal `BrokerOptions`' initializers (tested). `valkeyUrl` is the
 *           `QUEUE_BROKER_VALKEY_URL` secret, empty when unset.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0173 (no secret values in config); ADR 0148 (decision 3).
 */
import { z } from "zod";

import { BROKER_PUBLISHERS } from "#core/constants/broker-publishers.constant";

/** The shipped `BrokerConfig$`. */
export const BROKER_CONFIG_SCHEMA = z.object({
  driver: z.enum(BROKER_PUBLISHERS).default("memory"),
  valkeyUrl: z.string().default(""),
  valkey: z
    .object({
      keyPrefix: z.string().default("broker:"),
      maxLength: z.number().int().min(1).default(100_000),
    })
    .default(() => ({ keyPrefix: "broker:", maxLength: 100_000 })),
});
