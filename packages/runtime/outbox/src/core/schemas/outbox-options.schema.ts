/**
 * Stackra file contract:
 * Purpose: `OutboxOptions`, the shape of `OutboxConfig`: the one driver choice for the message store, the inbox and
 *          the change log, the relay's batch window, and the change log's retention.
 * Boundary: a schema class registered with the shipped `OUTBOX_CONFIG_SCHEMA` (gen compiles it once it compiles
 *           packages); the initializer equals the schema's default.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 26); ADR 0146 as amended.
 */
import "#core/types/outbox-driver-names.type";

import type { DriverName } from "@stackra/container";
import { Int, registerSchemas, Schema } from "@stackra/validation";

import type { OutboxDriver } from "#contracts/ports/outbox-driver.port";
import { OUTBOX_CONFIG_SCHEMA } from "#core/constants/outbox-config-schema.constant";

/**
 * The outbox options.
 *
 * @example
 * export class OutboxConfig extends Config({ schema: OutboxOptions }) {}
 */
export class OutboxOptions extends Schema {
  /**
   * How long, in seconds (0 to 60), the relay lets due messages gather before it delivers them: a tick waits until the
   * oldest due message has been due this long, or a full batch is due. `0` delivers at once (ADR 0221's lag); a
   * service that sends in batches (the audit read trail, five seconds) sets it in runway.
   */
  @Int({
    min: 0,
    max: 60,
  })
  batchWindowSeconds = 0;

  /**
   * How many days (1 to 400) the change log keeps a change after it was written, whether or not every consumer read it;
   * a consumer replays or backfills within this window. Whole daily partitions are dropped once they are older.
   */
  @Int({
    min: 1,
    max: 400,
  })
  changeRetentionDays = 7;

  /** Which driver runs: `postgres` keeps messages and ids in the service's database; `memory` in the process. */
  driver: DriverName<OutboxDriver> = "postgres";
}

registerSchemas([[OutboxOptions, OUTBOX_CONFIG_SCHEMA]]);
