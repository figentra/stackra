/**
 * Stackra file contract:
 * Purpose: `DatabaseConfigOptions`, the shape of `DatabaseConfig`: `health` tunes `DatabaseHealthIndicatorDriver`, the
 *          `/readyz` probe (how long `select 1` may take, and whether a failure fails readiness); `timeouts` are the
 *          statement, lock and idle-in-transaction timeouts every runtime session starts with; `pool` is the connection
 *          pool of one instance, whose `max` the boot replaces with the instance's share of the runway `poolBudget`;
 *          `readYourWrites` is how long a caller's `reads: "replica"` queries stay on the primary after its write.
 *          `region` is the runway region key (`eu`, `me`) of the deployment the database serves, which the tenancy
 *          `RegionGuardDriver` compares a tenant's placement with. `queries` is the query guard: the slow-statement
 *          threshold, the repeat limit of one statement shape per call and the strict switch (stackra-282).
 * Boundary: a shape class; it registers this package's own schema (`DATABASE_CONFIG_SCHEMA`) for itself when the
 *           module loads, so `buildConfig(DatabaseConfig)` validates with no generated file. No credential.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 26); registry gap R-27; gap analysis devx-ops "Health checks" (P0,
 *                     owner D10); ADR 0473 (decision 2: the pool); STA-1504 (the read-your-writes window); ADR
 *                     0172 (decision 3: the tenant region) and ADR 0353 (decision 1: region keys), stackra-310.
 */
import { Duration } from "@stackra/contracts";
import { Field, registerSchemas, Schema } from "@stackra/validation";

import { DATABASE_CONFIG_SCHEMA } from "#core/constants/database-config-schema.constant";
import type { DatabasePool } from "#core/types/database-pool.type";
import type { QueryGuard } from "#core/types/query-guard.type";
import type { SessionTimeouts } from "#core/types/session-timeouts.type";

/**
 * The database settings.
 *
 * @example
 * export class DatabaseConfig extends BaseDatabaseConfig {
 *   override health = { timeout: Duration.seconds(1), critical: true };
 * }
 */
export class DatabaseConfigOptions extends Schema {
  /** How `DatabaseHealthIndicatorDriver` probes the database for `/readyz`. */
  // reason: a nested option a host override replaces whole; the shipped config schema holds its rules
  @Field(DATABASE_CONFIG_SCHEMA.shape.health)
  health: {
    /** How long the probe may take. */
    timeout: Duration;
    /** Whether a failed probe fails readiness; `false` reports `degraded` instead. */
    critical: boolean;
  } = { timeout: Duration.seconds(2), critical: true };

  /** The timeouts every runtime session starts with; the boot hands them to `connect` as `DatabaseOptions.timeouts`. */
  // reason: a nested option a host override replaces whole; the shipped config schema holds its rules
  @Field(DATABASE_CONFIG_SCHEMA.shape.timeouts)
  timeouts: SessionTimeouts = {
    statement: Duration.seconds(30),
    lock: Duration.seconds(10),
    idleInTransaction: Duration.seconds(60),
  };

  /**
   * The connection pool of one instance; the boot sets `max` from `DATABASE_POOL_MAX` (the instance's share of the
   * runway `poolBudget`, ADR 0473) when the deploy hands it over.
   */
  // reason: a nested option a host override replaces whole; the shipped config schema holds its rules
  @Field(DATABASE_CONFIG_SCHEMA.shape.pool)
  pool: DatabasePool = { max: 10, min: 0, idleTimeout: Duration.seconds(10) };

  /**
   * How long a caller's `reads: "replica"` queries read the primary after its own action committed, so it never reads a
   * replica behind its write; set it above the replicas' usual lag (`DatabaseReplicaReadsDriver`).
   */
  // reason: a duration in either form, stored canonical; the shipped config schema holds its rule
  @Field(DATABASE_CONFIG_SCHEMA.shape.readYourWrites)
  readYourWrites: Duration = Duration.seconds(5);

  /**
   * How statements are watched: from `slow` a statement is logged as slow, one shape run more than `repeats` times in
   * one call is reported as an N+1 loop, and `strict` (tests, development) fails such a call instead of warning.
   */
  // reason: a nested option a host override replaces whole; the shipped config schema holds its rules
  @Field(DATABASE_CONFIG_SCHEMA.shape.queries)
  queries: QueryGuard = { slow: Duration.seconds(0.5), repeats: 10, strict: false };

  /**
   * The runway region key of this deployment (`eu`, `me`); runway's `config.database` layer sets it per stack. Empty
   * on a deployment that names no region, where a bound region guard fails closed.
   */
  region = "";
}

registerSchemas([[DatabaseConfigOptions, DATABASE_CONFIG_SCHEMA]]);
