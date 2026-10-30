/**
 * Stackra file contract:
 * Purpose: the polar chart route of @figentra/playground: its path. The page it renders is
 *          `polar-chart.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5); STA-1371 (wave D).
 */
import { Route } from "@stackra/navigation";

/** The PolarChart page, at `/polar-chart`. */
export class PolarChartRoute extends Route({ path: "/polar-chart" }) {}
