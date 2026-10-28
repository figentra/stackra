/**
 * Stackra file contract:
 * Purpose: `OutboxConfig`, the outbox configuration (key `outbox`): the `driver` choice runway sets per environment
 *          (`postgres` by default, `memory` for a test or a single process), which picks the message store, the inbox and
 *          the change log, `batchWindowSeconds`, how long the relay lets due messages gather (`0`, none, by default),
 *          `changeRetentionDays`, how long the change log keeps a change (7 by default), and `pruneAfterDays`, when dead
 *          letters and received event ids are pruned (30 by default).
 * Boundary: a configuration class over `OutboxOptions` with no env map; runway's `config.outbox` layer sets it. A host
 *           overrides it as `class OutboxConfig extends BaseOutboxConfig` with `override` members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 20); ADR 0146 as amended; ADR 0296 (decision 1); ADR 0078
 *                     (decision 4).
 */
import { Config } from "@stackra/config";

import { OutboxOptions } from "#core/schemas/outbox-options.schema";

/**
 * The outbox configuration.
 *
 * @example
 * import { OutboxConfig as BaseOutboxConfig } from "@stackra/outbox";
 *
 * export class OutboxConfig extends BaseOutboxConfig {
 *   override driver: DriverName<OutboxDriver> = "memory";
 * }
 */
export class OutboxConfig extends Config({ schema: OutboxOptions }) {}
