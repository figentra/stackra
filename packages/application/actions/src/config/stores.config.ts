/**
 * Stackra file contract:
 * Purpose: `StoresConfig`, the configuration of the action pipeline's hot-path stores (key `actions.stores`): the
 *          idempotency and rate-limit drivers and the Valkey server and key prefix they share.
 * Boundary: a configuration class over `StoresOptions` with no env map; runway's `config.actions.stores` layer sets it
 *           per environment, and the `ACTIONS_VALKEY_URL` secret comes from the secret store.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0136; ADR 0217.
 */
import { Config } from "@stackra/config";

import { StoresOptions } from "#core/schemas/stores-options.schema";

/**
 * The action stores' configuration.
 *
 * @example
 * import { StoresConfig as BaseStoresConfig } from "@stackra/actions";
 *
 * export class StoresConfig extends BaseStoresConfig {
 *   override idempotency: DriverName<IdempotencyStore> = "valkey";
 * }
 */
export class StoresConfig extends Config({ schema: StoresOptions }) {}
