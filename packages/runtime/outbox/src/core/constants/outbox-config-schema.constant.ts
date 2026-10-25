/**
 * Stackra file contract:
 * Purpose: `OUTBOX_CONFIG_SCHEMA`, the zod schema this package ships for `OutboxConfig` (exported as `OutboxConfig$`):
 *          which driver stores the messages and the received event ids.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults and a host's generated `OutboxConfig$` can `.extend` it. The default equals `OutboxOptions`'
 *           initializer (tested). No credential: the Postgres drivers use the service's own database connection.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0173 (no secret values in config).
 */
import { z } from "zod";

import { OUTBOX_DRIVERS } from "#core/constants/outbox-drivers.constant";

/** The shipped `OutboxConfig$`. */
export const OUTBOX_CONFIG_SCHEMA = z.object({
  driver: z.enum(OUTBOX_DRIVERS).default("postgres"),
});
