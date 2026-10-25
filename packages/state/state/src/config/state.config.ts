/**
 * Stackra file contract:
 * Purpose: `StateConfig`, the client-state configuration (key `state`): the storage area persisted stores write to,
 *          blocking hydration and devtools in production.
 * Boundary: a configuration class over `StateOptions` with no env map. A host overrides it as
 *           `class StateConfig extends BaseStateConfig` with `override` members only, inheriting the key.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0079; ADR 0256.
 */
import { Config } from "@stackra/config";

import { StateOptions } from "#core/schemas/state-options.schema";

/**
 * The client-state configuration.
 *
 * @example
 * import { StateConfig as BaseStateConfig } from "@stackra/state";
 *
 * export class StateConfig extends BaseStateConfig {
 *   override persistStore: StorageArea = StorageArea.Prefs;
 *   override blockingHydration = true;
 * }
 */
export class StateConfig extends Config({ schema: StateOptions }) {}
