/**
 * Stackra file contract:
 * Purpose: `LOCKING_CONFIG_SCHEMA`, the zod schema this package ships for `LockingConfig` (exported as
 *          `LockingConfig$`): which driver holds the locks, and the Valkey server and key prefix of the `valkey` driver.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults and a host's generated `LockingConfig$` can `.extend` it. The default equals
 *           `LockingOptions`' initializers (tested). The Postgres driver uses the service's own database connection;
 *           `valkeyUrl` is the `LOCKING_VALKEY_URL` secret, empty when unset.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0173 (no secret values in config).
 */
import { z } from "zod";

import { LOCK_DRIVERS } from "#core/constants/lock-drivers.constant";

/** The shipped `LockingConfig$`. */
export const LOCKING_CONFIG_SCHEMA = z.object({
  driver: z.enum(LOCK_DRIVERS).default("postgres"),
  valkeyUrl: z.string().default(""),
  valkey: z
    .object({ keyPrefix: z.string().default("lock:") })
    .default(() => ({ keyPrefix: "lock:" })),
});
