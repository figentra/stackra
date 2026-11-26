/**
 * Stackra file contract:
 * Purpose: `StoresOptions`, the shape of `StoresConfig`: which driver keeps Idempotency-Keys and which keeps the token
 *          buckets, the Valkey server and key prefix of the `valkey` drivers, and the running environment.
 * Boundary: a shape class; it registers this package's own schema (`STORES_CONFIG_SCHEMA`) for itself when the module
 *           loads. The defaults are `memory` (ADR 0266 decision 2), allowed only in `dev` and `test`: a deployed
 *           environment (`STACKRA_ENVIRONMENT` `preview`, `staging` or `production`, which the generated Encore app
 *           sets from Encore's report) names `valkey` or `postgres` (@stackra/database's durable drivers) in runway,
 *           whose values reach boot through gen's `#stackra/runway-config`, or boot fails (STA-2798). The Valkey URL carries its
 *           password, so it is the `ACTIONS_VALKEY_URL` secret, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 3); ADR 0217 (decision 2); ADR 0266; ADR 0294 (decisions 4, 19 and 26); ADR
 *                     0173; STA-2798.
 */
import "#core/types/store-driver-names.type";

import { Secret } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { Field, registerSchemas, Schema } from "@stackra/validation";

import type { IdempotencyStore } from "#contracts/ports/idempotency-store.port";
import type { RateLimitStore } from "#contracts/ports/rate-limit-store.port";
import { STORES_CONFIG_SCHEMA } from "#core/constants/stores-config-schema.constant";
import { StoreEnvironment } from "#core/enums/store-environment.enum";

/**
 * The action stores' settings.
 *
 * @example
 * export class StoresConfig extends BaseStoresConfig {
 *   override idempotency: DriverName<IdempotencyStore> = "valkey";
 *   override rateLimit: DriverName<RateLimitStore> = "valkey";
 * }
 */
export class StoresOptions extends Schema {
  /** The `valkey` drivers' server (`redis://` or `rediss://`, with its password); empty until the secret is set. */
  @Secret("ACTIONS_VALKEY_URL")
  valkeyUrl = "";

  /** The `valkey` drivers' keys. */
  // reason: one inline key-prefix object that a host override replaces whole; the shipped schema already says its rule
  @Field(STORES_CONFIG_SCHEMA.shape.valkey)
  valkey: {
    /** Put in front of every key, so members that share one server never share a key. */
    keyPrefix: string;
  } = { keyPrefix: "actions:" };

  /** Where Idempotency-Keys and their outputs are kept. */
  idempotency: DriverName<IdempotencyStore> = "memory";

  /** Where the rate limit's token buckets are kept. */
  rateLimit: DriverName<RateLimitStore> = "memory";

  /**
   * The running environment (`STACKRA_ENVIRONMENT`). Only `dev` and `test` may keep either store in `memory`; a
   * deployed one (`preview`, `staging`, `production`) fails boot until both name a durable driver.
   */
  environment: StoreEnvironment = StoreEnvironment.Dev;
}

registerSchemas([[StoresOptions, STORES_CONFIG_SCHEMA]]);
