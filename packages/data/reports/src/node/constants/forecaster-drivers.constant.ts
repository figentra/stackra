/**
 * Stackra file contract:
 * Purpose: `FORECASTER_DRIVERS`, the driver names of the `Forecaster` port that `ReportsConfig.forecaster` may select:
 *          `http` (the region's `tools-forecast` image) and `memory` (in process, for tests and local hosts).
 * Boundary: internal data; it types `ReportsOptions.forecaster` through the `DriverRegistry` entry and checks it in the
 *           shipped schema. The names must equal the ones gen writes for this port in a host's wiring.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 8); ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9).
 */

/** The selectable forecaster drivers. */
export const FORECASTER_DRIVERS = Object.freeze(["http", "memory"] as const);
