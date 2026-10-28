/**
 * Stackra file contract:
 * Purpose: `ReportsConfig`, the report runner's configuration: page size, row cap, statement timeout and replica.
 * Boundary: a configuration class over `ReportsOptions`; runway's config layer sets values per environment, and a host
 *           overrides it with `override` members only. No field is read from the environment.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0363; ADR 0470 (decision 3).
 */
import { Config } from "@stackra/config";

import { ReportsOptions } from "#node/schemas/reports-options.schema";

/**
 * Read by `PostgresReportRunnerDriver`.
 *
 * @example
 * export class ReportsConfig extends BaseReportsConfig { override maxRows = 50_000; }
 */
export class ReportsConfig extends Config({ schema: ReportsOptions }) {}
