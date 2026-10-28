/**
 * Stackra file contract:
 * Purpose: `ReportsConfig`, the reports configuration: page size, row cap, statement timeout, replica and the report
 *          engine (`engine`, the `ReportEngine` driver generated wiring selects).
 * Boundary: a configuration class over `ReportsOptions`; runway's config layer sets values per environment, and a host
 *           overrides it with `override` members only. No field is read from the environment.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0363; ADR 0470 (decisions 3 and 8).
 */
import { Config } from "@stackra/config";

import { ReportsOptions } from "#node/schemas/reports-options.schema";

/**
 * Read by `PostgresReportEngineDriver`; `engine` selects the `ReportEngine` driver in generated wiring.
 *
 * @example
 * export class ReportsConfig extends BaseReportsConfig { override maxRows = 50_000; }
 */
export class ReportsConfig extends Config({ schema: ReportsOptions }) {}
