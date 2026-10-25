/**
 * Stackra file contract:
 * Purpose: `LOCKING_CONFIG_SCHEMA`, the zod schema this package ships for `LockingConfig` (exported as
 *          `LockingConfig$`): which driver holds the locks.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults and a host's generated `LockingConfig$` can `.extend` it. The default equals
 *           `LockingOptions`' initializer (tested). No credential: the Postgres driver uses the service's own database
 *           connection.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0173 (no secret values in config).
 */
import { z } from "zod";

import { LOCK_DRIVERS } from "#core/constants/lock-drivers.constant";

/** The shipped `LockingConfig$`. */
export const LOCKING_CONFIG_SCHEMA = z.object({
  driver: z.enum(LOCK_DRIVERS).default("postgres"),
});
