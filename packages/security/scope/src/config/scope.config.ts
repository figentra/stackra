/**
 * Stackra file contract:
 * Purpose: `ScopeConfig`, the scope tree a deployment declares (key `scope`): its levels in order, the root node's path
 *          and the aliases of its levels. Node creation, the root step of the resolver chain and the level labels read
 *          it through the container or by constructor type.
 * Boundary: a configuration class: the options are `ScopeOptions`, the key is derived (`scope`), and no field reads the
 *           environment. A deployment's override keeps the name, imports this class as `BaseScopeConfig` and sets
 *           `override` field defaults only. Loading this module registers the shipped schema, so `buildConfig`
 *           validates the class and every override. Holds no secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decisions 2 and 4); ADR 0294 (decision 19; as amended by v3.1: the Base alias); ADR
 *                     0146 as amended.
 */
import { Config } from "@stackra/config";
import { registerSchemas } from "@stackra/validation";

import { ScopeConfig$ } from "#core/constants/scope-config-schema.constant";
import { ScopeOptions } from "#core/schemas/scope-options.schema";

// shortcut: registered here until gen writes the package's #stackra/schemas registration (registry gap G1, STA-339).
registerSchemas([[ScopeOptions, ScopeConfig$]]);

/**
 * The scope tree's levels.
 *
 * @example
 * // src/overrides/scope/scope.config.ts of a deployment
 * import { ScopeConfig as BaseScopeConfig } from "@stackra/scope";
 *
 * export class ScopeConfig extends BaseScopeConfig {
 *   override levels = [...this.levels, { key: "store", recursive: true }];
 *   override aliases = { product: "app::scope.brand" };
 * }
 */
export class ScopeConfig extends Config({ schema: ScopeOptions }) {}
