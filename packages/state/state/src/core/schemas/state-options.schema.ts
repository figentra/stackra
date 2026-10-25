/**
 * Stackra file contract:
 * Purpose: `StateOptions`, the shape of `StateConfig`: the storage area persisted stores write to, whether the app's
 *          first render waits until persisted stores are read, and whether store devtools also run in a production
 *          build.
 * Boundary: a shape class; it registers this package's own schema (`STATE_CONFIG_SCHEMA`) for itself when the module
 *           loads, so `buildConfig(StateConfig)` validates with no generated file. The fields are read by the app
 *           runtime's state context (`@stackra/app`), which opens the area and hydrates the stores; a store's own
 *           `persist` names the area it writes. `persistStore` is a `StorageArea` code, typed as a string so this
 *           package needs no storage import; a host restates it as `StorageArea`.
 * Runtime: isomorphic
 * Governing contract: ADR 0079; ADR 0256; ADR 0294 (decisions 19 and 26); ADR 0305 (rule 34).
 */
import { registerSchemas, Schema } from "@stackra/validation";

import { STATE_CONFIG_SCHEMA } from "#core/constants/state-config-schema.constant";

/**
 * The client-state settings.
 *
 * @example
 * export class StateConfig extends BaseStateConfig {
 *   override persistStore: StorageArea = StorageArea.Prefs;
 *   override blockingHydration = true;
 * }
 */
export class StateOptions extends Schema {
  /** The storage area persisted stores write to (a `StorageArea` code); the per-install preferences by default. */
  persistStore = "prefs";

  /** Keep the first render until persisted stores are read, instead of rendering defaults and then patching. */
  blockingHydration = false;

  /** Store devtools always run in development; this also enables them in a production build. */
  devtoolsInProduction = false;
}

registerSchemas([[StateOptions, STATE_CONFIG_SCHEMA]]);
