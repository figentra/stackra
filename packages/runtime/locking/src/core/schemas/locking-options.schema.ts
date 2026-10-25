/**
 * Stackra file contract:
 * Purpose: `LockingOptions`, the shape of `LockingConfig`: which lock driver runs.
 * Boundary: a shape class; it registers this package's own schema (`LOCKING_CONFIG_SCHEMA`) for itself when the module
 *           loads, so `buildConfig(LockingConfig)` validates with no generated file. Deploy-time values only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 26); ADR 0305 (rule 34); ADR 0149 (decision 1: Postgres advisory
 *                     locks by default).
 */
import "#core/types/lock-driver-names.type";

import type { DriverName } from "@stackra/container";
import { registerSchemas, Schema } from "@stackra/validation";

import type { LockDriver } from "#contracts/ports/lock-driver.port";
import { LOCKING_CONFIG_SCHEMA } from "#core/constants/locking-config-schema.constant";

/**
 * The locking settings.
 *
 * @example
 * export class LockingConfig extends BaseLockingConfig {
 *   override driver: DriverName<LockDriver> = "memory";
 * }
 */
export class LockingOptions extends Schema {
  /** Which driver runs: `postgres` holds advisory locks in the service's database; `memory` in the process. */
  driver: DriverName<LockDriver> = "postgres";
}

registerSchemas([[LockingOptions, LOCKING_CONFIG_SCHEMA]]);
