/**
 * Stackra file contract:
 * Purpose: `REPORT_ENGINES`, the driver names of the `ReportEngine` port that `ReportsConfig.engine` may select:
 *          `postgres` (this package's `./node`). The Pro `clickhouse` and `duckdb` engines join the list with their
 *          driver (stackra-417, ADR 0461), never before, so a name always has a driver behind it.
 * Boundary: internal data; it types `ReportsOptions.engine` through the `DriverRegistry` entry and checks it in the
 *           shipped schema. The names must equal the ones gen writes for this port in a host's wiring, because both
 *           augment the same `DriverRegistry` key.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decision 8); ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9); ADR 0227 and ADR
 *                     0190 (decision 3: the OLAP engine stays deferred behind a driver).
 */

/** The selectable report engines. */
export const REPORT_ENGINES = Object.freeze(["postgres"] as const);
