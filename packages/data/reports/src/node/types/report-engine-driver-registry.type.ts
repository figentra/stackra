/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entry of the `ReportEngine` port, so `ReportsOptions.engine` (typed
 *          `DriverName<ReportEngine>`) and a runway `reports.engine` value take exactly the engine names that ship.
 * Boundary: a module augmentation only; the stand-in for the entry this package's generated wiring writes (ADR 0263
 *           decision 9). `ReportsOptions` imports this file so the augmentation travels with the shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9); ADR 0470 (decision 8).
 */
import type { REPORT_ENGINES } from "#node/constants/report-engines.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `ReportEngine` (`postgres`). */
    "reports.ReportEngine": (typeof REPORT_ENGINES)[number];
  }
}
