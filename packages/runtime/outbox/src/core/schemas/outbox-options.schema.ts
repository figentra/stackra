/**
 * Stackra file contract:
 * Purpose: `OutboxOptions`, the shape of `OutboxConfig`: the one driver choice for the message store and the inbox.
 * Boundary: a schema class registered with the shipped `OUTBOX_CONFIG_SCHEMA` (gen compiles it once it compiles
 *           packages); the initializer equals the schema's default.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 26); ADR 0146 as amended.
 */
import "#core/types/outbox-driver-names.type";

import type { DriverName } from "@stackra/container";
import { registerSchemas, Schema } from "@stackra/validation";

import type { OutboxDriver } from "#contracts/ports/outbox-driver.port";
import { OUTBOX_CONFIG_SCHEMA } from "#core/constants/outbox-config-schema.constant";

/**
 * The outbox options.
 *
 * @example
 * export class OutboxConfig extends Config({ schema: OutboxOptions }) {}
 */
export class OutboxOptions extends Schema {
  /** Which driver runs: `postgres` keeps messages and ids in the service's database; `memory` in the process. */
  driver: DriverName<OutboxDriver> = "postgres";
}

registerSchemas([[OutboxOptions, OUTBOX_CONFIG_SCHEMA]]);
