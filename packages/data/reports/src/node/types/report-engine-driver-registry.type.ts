/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entries of the `ReportEngine`, `ProductAnalytics` and `Forecaster` ports, so
 *          `ReportsOptions.engine`, `ReportsOptions.productAnalytics` and `ReportsOptions.forecaster` (typed `DriverName<Port>`) and their runway
 *          values take exactly the driver names that ship.
 * Boundary: a module augmentation only; the stand-in for the entry this package's generated wiring writes (ADR 0263
 *           decision 9). `ReportsOptions` imports this file so the augmentation travels with the shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9); ADR 0470 (decision 8); ADR 0163
 *                     (decision 5 as amended 2026-10-28).
 */
import type { FORECASTER_DRIVERS } from "#node/constants/forecaster-drivers.constant";
import type { PRODUCT_ANALYTICS_DRIVERS } from "#node/constants/product-analytics-drivers.constant";
import type { REPORT_ENGINES } from "#node/constants/report-engines.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `ReportEngine` (`postgres`). */
    "reports.ReportEngine": (typeof REPORT_ENGINES)[number];
    /** The driver names of `ProductAnalytics` (`posthog`). */
    "reports.ProductAnalytics": (typeof PRODUCT_ANALYTICS_DRIVERS)[number];
    /** The driver names of `Forecaster` (`http`, `memory`). */
    "reports.Forecaster": (typeof FORECASTER_DRIVERS)[number];
  }
}
