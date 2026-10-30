/**
 * Stackra file contract:
 * Purpose: the dashboard-grid route of @figentra/playground: its path. The page it renders is `dashboard-grid.tsx` beside it (ADR 0294
 *          decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5); STA-1371.
 */
import { Route } from "@stackra/navigation";

/** The Dashboard grid page, at `/dashboard-grid`. */
export class DashboardGridRoute extends Route({ path: "/dashboard-grid" }) {}
