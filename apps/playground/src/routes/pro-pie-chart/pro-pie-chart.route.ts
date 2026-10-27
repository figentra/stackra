/**
 * Stackra file contract:
 * Purpose: the PieChart route of @figentra/playground: its path, title and category. The page it renders is
 *          `pro-pie-chart.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5); ADR 0310 (decision 12).
 */
import { Route } from "@stackra/navigation";

import type { PageCategory } from "#src/enums/page-category.enum";

/** The `@stackra-pro/ui` PieChart page, at `/pro-pie-chart`. */
export class ProPieChartRoute extends Route({ path: "/pro-pie-chart" }) {
  /** The page title, the component's name. */
  static readonly title = "PieChart";

  /** The category the page is listed under: the `@stackra-pro/ui` pages. */
  static readonly category: PageCategory = "Charts";
}
