/**
 * Stackra file contract:
 * Purpose: `QUEUE_CONFIG_SCHEMA`, the zod schema this package ships for `QueueConfig` (exported as `QueueConfig$`):
 *          which driver stores the jobs.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults and a host's generated `QueueConfig$` can `.extend` it. The default equals `QueueOptions`'
 *           initializer (tested). No credential: the Postgres driver uses the service's own database connection.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0173 (no secret values in config).
 */
import { z } from "zod";

import { QUEUE_DRIVERS } from "#core/constants/queue-drivers.constant";

/** The shipped `QueueConfig$`. */
export const QUEUE_CONFIG_SCHEMA = z.object({
  driver: z.enum(QUEUE_DRIVERS).default("postgres"),
});
