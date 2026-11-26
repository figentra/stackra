/**
 * Stackra file contract:
 * Purpose: `STORES_CONFIG_SCHEMA`, the zod schema this package ships for `StoresConfig` (exported as `StoresConfig$`):
 *          the idempotency and rate-limit store drivers, the Valkey server and key prefix they share, and the running
 *          environment. A deployed environment (`preview`, `staging`, `production`) refuses the `memory` stores, so
 *          `buildConfig` (and with it boot) fails with `ConfigInvalidError` naming the field.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults; they equal `StoresOptions`' initializers (tested). `valkeyUrl` is the `ACTIONS_VALKEY_URL`
 *           secret, empty when unset. The refusal is a refinement of the object, so `.shape` stays readable.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0173 (no secret values in config); ADR 0266 (decision 2); STA-2798.
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { MEMORY_STORE_ENVIRONMENTS } from "#core/constants/memory-store-environments.constant";
import { STORE_DRIVERS } from "#core/constants/store-drivers.constant";
import { StoreEnvironment } from "#core/enums/store-environment.enum";

/** What each store keeps, for the refusal's message. */
const KEEPS = {
  idempotency: "Idempotency-Keys",
  rateLimit: "the rate limit's token buckets",
} as const;

/** The shipped `StoresConfig$`. */
export const STORES_CONFIG_SCHEMA = z
  .object({
    idempotency: z.enum(STORE_DRIVERS).default("memory"),
    rateLimit: z.enum(STORE_DRIVERS).default("memory"),
    valkeyUrl: z.string().default(""),
    valkey: z
      .object({ keyPrefix: z.string().default("actions:") })
      .default(() => ({ keyPrefix: "actions:" })),
    // the known environments: a typo fails config, never runs as dev
    environment: z.enum(Enum.values(StoreEnvironment)).default(StoreEnvironment.Dev),
  })
  .superRefine((value, context) => {
    if (MEMORY_STORE_ENVIRONMENTS.includes(value.environment)) return;
    for (const field of ["idempotency", "rateLimit"] as const)
      if (value[field] === "memory")
        context.addIssue({
          code: "custom",
          path: [field],
          message:
            `the memory store keeps ${KEEPS[field]} in one process and loses them on restart, so ` +
            `${value.environment} refuses it: select postgres or valkey (runway config.actions.stores.${field})`,
        });
  });
