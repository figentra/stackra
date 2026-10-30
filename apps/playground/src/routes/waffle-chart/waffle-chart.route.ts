/**
 * Stackra file contract:
 * Purpose: the waffle chart route of @figentra/playground: its path. The page it renders is
 *          `waffle-chart.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5); STA-1371 (wave D).
 */
import { Route } from "@stackra/navigation";

/** The WaffleChart page, at `/waffle-chart`. */
export class WaffleChartRoute extends Route({ path: "/waffle-chart" }) {}
