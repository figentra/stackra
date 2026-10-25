/**
 * Stackra file contract:
 * Purpose: the RadarChart route of @figentra/playground: its path, title and category. The page it renders is
 *          `pro-radar-chart.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5); ADR 0310 (decision 12).
 */
import type { PageCategory } from "#src/enums/page-category.enum";

/** The `@stackra-pro/ui` RadarChart page, at `/pro-radar-chart`. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class ProRadarChartRoute extends Route({ path: "/pro-radar-chart" }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static fields
export class ProRadarChartRoute {
  /** The URL path of the route: `/` and the folder name, which the e2e suite relies on. */
  static readonly path = "/pro-radar-chart";

  /** The page title, the component's name. */
  static readonly title = "RadarChart";

  /** The category the page is listed under: the `@stackra-pro/ui` pages. */
  static readonly category: PageCategory = "Charts";
}
