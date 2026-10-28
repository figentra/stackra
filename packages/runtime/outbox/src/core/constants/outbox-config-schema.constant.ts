/**
 * Stackra file contract:
 * Purpose: `OUTBOX_CONFIG_SCHEMA`, the zod schema this package ships for `OutboxConfig` (exported as `OutboxConfig$`):
 *          which driver stores the messages, the received event ids and the change log, the relay's batch window
 *          (OS-289's audit read trail batches five seconds), and how many days the change log keeps a change.
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
  batchWindowSeconds: z.number().int().min(0).max(60).default(0),
  changeRetentionDays: z.number().int().min(1).max(400).default(7),
});
