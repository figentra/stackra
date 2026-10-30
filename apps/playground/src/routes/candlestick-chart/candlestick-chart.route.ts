/**
 * Stackra file contract:
 * Purpose: the candlestick chart route of @figentra/playground: its path. The page it renders is `candlestick-chart.tsx` beside it (ADR 0294
 *          decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

/** The CandlestickChart page, at `/candlestick-chart`. */
export class CandlestickChartRoute extends Route({ path: "/candlestick-chart" }) {}
