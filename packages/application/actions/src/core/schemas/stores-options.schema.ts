/**
 * Stackra file contract:
 * Purpose: `StoresOptions`, the shape of `StoresConfig`: which driver keeps Idempotency-Keys and which keeps the token
 *          buckets, and the Valkey server and key prefix of the `valkey` drivers.
 * Boundary: a shape class; it registers this package's own schema (`STORES_CONFIG_SCHEMA`) for itself when the module
 *           loads. The defaults are `memory` (ADR 0266 decision 2); a deployment with more than one instance names
 *           `valkey` or `postgres` (@stackra/database's durable drivers) in runway. The Valkey URL carries its password, so it is
 *           the `ACTIONS_VALKEY_URL` secret, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 3); ADR 0217 (decision 2); ADR 0266; ADR 0294 (decisions 4, 19 and 26); ADR
 *                     0173.
 */
import "#core/types/store-driver-names.type";

import { Secret } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { registerSchemas, Schema } from "@stackra/validation";

import type { IdempotencyStore } from "#contracts/ports/idempotency-store.port";
import type { RateLimitStore } from "#contracts/ports/rate-limit-store.port";
import { STORES_CONFIG_SCHEMA } from "#core/constants/stores-config-schema.constant";

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

  /** Where Idempotency-Keys and their outputs are kept. */
  idempotency: DriverName<IdempotencyStore> = "memory";

  /** Where the rate limit's token buckets are kept. */
  rateLimit: DriverName<RateLimitStore> = "memory";

  /** The `valkey` drivers' keys. */
  valkey: {
    /** Put in front of every key, so members that share one server never share a key. */
    keyPrefix: string;
  } = { keyPrefix: "actions:" };
}

registerSchemas([[StoresOptions, STORES_CONFIG_SCHEMA]]);
