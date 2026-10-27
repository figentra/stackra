/**
 * Stackra file contract:
 * Purpose: `DatabaseOptions`, the shape of `DatabaseConfig`: `health` tunes `DatabaseHealthIndicatorDriver`, the
 *          `/readyz` probe (how long `select 1` may take, and whether a failure fails readiness).
 * Boundary: a shape class; it registers this package's own schema (`DATABASE_CONFIG_SCHEMA`) for itself when the
 *           module loads, so `buildConfig(DatabaseConfig)` validates with no generated file. No credential.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 26); registry gap R-27; gap analysis devx-ops "Health checks" (P0,
 *                     owner D10).
 */
import { Duration } from "@stackra/contracts";
import { Field, registerSchemas, Schema } from "@stackra/validation";

import { DATABASE_CONFIG_SCHEMA } from "#core/constants/database-config-schema.constant";

/**
 * The database settings.
 *
 * @example
 * export class DatabaseConfig extends BaseDatabaseConfig {
 *   override health = { timeout: Duration.seconds(1), critical: true };
 * }
 */
export class DatabaseOptions extends Schema {
  /** How `DatabaseHealthIndicatorDriver` probes the database for `/readyz`. */
  // reason: a nested option a host override replaces whole; the shipped config schema holds its rules
  @Field(DATABASE_CONFIG_SCHEMA.shape.health)
  health: {
    /** How long the probe may take. */
    timeout: Duration;
    /** Whether a failed probe fails readiness; `false` reports `degraded` instead. */
    critical: boolean;
  } = { timeout: Duration.seconds(2), critical: true };
}

registerSchemas([[DatabaseOptions, DATABASE_CONFIG_SCHEMA]]);
