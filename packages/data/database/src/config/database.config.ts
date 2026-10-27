/**
 * Stackra file contract:
 * Purpose: `DatabaseConfig`, the database configuration (key `database`): the `/readyz` probe's timeout and whether
 *          a failed probe fails readiness.
 * Boundary: a configuration class over `DatabaseOptions` with no env map; runway's `config.database` layer sets it.
 *           The connection URL is not here: it is the process's `DATABASE_URL`. A host overrides it as
 *           `class DatabaseConfig extends BaseDatabaseConfig` with `override` members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 20); ADR 0146 as amended; registry gap R-27; gap analysis
 *                     devx-ops "Health checks" (P0, owner D10).
 */
import { Config } from "@stackra/config";

import { DatabaseOptions } from "#core/schemas/database-options.schema";

/**
 * The database configuration.
 *
 * @example
 * import { DatabaseConfig as BaseDatabaseConfig } from "@stackra/database";
 *
 * export class DatabaseConfig extends BaseDatabaseConfig {
 *   override health = { timeout: Duration.seconds(1), critical: true };
 * }
 */
export class DatabaseConfig extends Config({ schema: DatabaseOptions }) {}
