/**
 * Stackra file contract:
 * Purpose: `QueryConfig`, a client's server-state configuration (key `query`): the key scope, the persisted cache, the
 *          offline queue and the read defaults.
 * Boundary: a configuration class over `QueryOptions` with no env map. A host overrides it as `class QueryConfig
 *           extends BaseQueryConfig` with `override` members only, inheriting the key; its presence mounts the query
 *           context, so an app writes no query provider. This package only declares the values.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0295 (decision 10); ADR 0059; ADR 0252.
 */
import { Config } from "@stackra/config";

import { QueryOptions } from "#core/schemas/query-options.schema";

/**
 * A client's server-state configuration.
 *
 * @example
 * import { QueryConfig as BaseQueryConfig, QueryScope } from "@stackra/query";
 *
 * export class QueryConfig extends BaseQueryConfig {
 *   override scope: QueryScope = QueryScope.ActiveScope;
 *   override staleTimeSeconds = 30;
 * }
 */
export class QueryConfig extends Config({ schema: QueryOptions }) {}
