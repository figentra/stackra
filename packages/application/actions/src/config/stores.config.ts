/**
 * Stackra file contract:
 * Purpose: `StoresConfig`, the configuration of the action pipeline's hot-path stores (key `actions.stores`): the
 *          idempotency and rate-limit drivers, the Valkey server and key prefix they share, and the running
 *          environment, which refuses the `memory` stores outside `dev` and `test` at boot.
 * Boundary: a configuration class over `StoresOptions`; its env map is `STACKRA_ENVIRONMENT` only, which makes
 *           `environment` runtime-only: `buildConfig` checks the variable against the one closed list and refuses a
 *           value for the field (STA-2844), and the server `createApp` settles it through `readEnvironment` (a
 *           deployed Encore service from the generated `environment.ts`). Runway's `config.actions.stores` layer sets
 *           the drivers per environment (gen's `#stackra/runway-config`, applied by `bootApp`), and the
 *           `ACTIONS_VALKEY_URL` secret comes from the secret store.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0136; ADR 0217; ADR 0266 (decision 2);
 *                     ADR 0296 (amendment 2026-11-26); STA-2844; STA-2798.
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
export class StoresConfig extends Config({
  schema: StoresOptions,
  env: { environment: "STACKRA_ENVIRONMENT" },
}) {}
