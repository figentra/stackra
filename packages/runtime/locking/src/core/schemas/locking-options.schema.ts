/**
 * Stackra file contract:
 * Purpose: `LockingOptions`, the shape of `LockingConfig`: which lock driver runs, and the `valkey` driver's server
 *          and key prefix.
 * Boundary: a shape class; it registers this package's own schema (`LOCKING_CONFIG_SCHEMA`) for itself when the module
 *           loads, so `buildConfig(LockingConfig)` validates with no generated file. Deploy-time values only. The Valkey
 *           URL carries the password, so it is the `LOCKING_VALKEY_URL` secret, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 26); ADR 0305 (rule 34); ADR 0149 (decision 1: Postgres advisory
 *                     locks by default); ADR 0103 (decision 2: a Valkey driver); ADR 0173.
 */
import "#core/types/lock-driver-names.type";

import { Secret } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { Field, registerSchemas, Schema } from "@stackra/validation";

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
  /** The `valkey` driver's server (`redis://` or `rediss://`, with its password); empty until the secret is set. */
  @Secret("LOCKING_VALKEY_URL")
  valkeyUrl = "";

  /** The `valkey` driver's keys. */
  // reason: a nested driver option a host override replaces whole; the shipped config schema holds its rules
  @Field(LOCKING_CONFIG_SCHEMA.shape.valkey)
  valkey: {
    /** Put in front of every lock key, so members that share one server never share a lock by accident. */
    keyPrefix: string;
  } = { keyPrefix: "lock:" };

  /** Which driver runs: `postgres` holds advisory locks in the service's database; `memory` in the process. */
  driver: DriverName<LockDriver> = "postgres";
}

registerSchemas([[LockingOptions, LOCKING_CONFIG_SCHEMA]]);
