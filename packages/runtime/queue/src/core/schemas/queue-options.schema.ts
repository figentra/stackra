/**
 * Stackra file contract:
 * Purpose: `QueueOptions`, the shape of `QueueConfig`: which queue driver stores or carries the jobs.
 *          `health` tunes `QueueHealthIndicatorDriver`, the `/readyz` probe.
 * Boundary: a shape class; it registers this package's own schema (`QUEUE_CONFIG_SCHEMA`) for itself when the module
 *           loads, so `buildConfig(QueueConfig)` validates with no generated file. Deploy-time values only; queue sizes
 *           and worker counts are runway's.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 26); ADR 0305 (rule 34); ADR 0148 (decision 3: the Postgres queue
 *                     on-prem).
 */
import "#core/types/queue-driver-names.type";

import type { DriverName } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { Field, registerSchemas, Schema } from "@stackra/validation";

import type { QueueDriver } from "#contracts/ports/queue-driver.port";
import { QUEUE_CONFIG_SCHEMA } from "#core/constants/queue-config-schema.constant";

/**
 * The queue settings.
 *
 * @example
 * export class QueueConfig extends BaseQueueConfig {
 *   override driver: DriverName<QueueDriver> = "memory";
 * }
 */
export class QueueOptions extends Schema {
  /** How `QueueHealthIndicatorDriver` probes the queue for `/readyz`. */
  // reason: a nested option a host override replaces whole; the shipped config schema holds its rules
  @Field(QUEUE_CONFIG_SCHEMA.shape.health)
  health: {
    /** How long the probe may take. */
    timeout: Duration;
    /** Whether a failed probe fails readiness; `false` reports `degraded` instead. */
    critical: boolean;
  } = { timeout: Duration.seconds(2), critical: true };

  /**
   * Which driver runs: `postgres` keeps jobs in the service's database; `memory` in the process; `broker` publishes them
   * to the generated Pub/Sub topics (SaaS), keeping only dead letters in the database.
   */
  driver: DriverName<QueueDriver> = "postgres";
}

registerSchemas([[QueueOptions, QUEUE_CONFIG_SCHEMA]]);
