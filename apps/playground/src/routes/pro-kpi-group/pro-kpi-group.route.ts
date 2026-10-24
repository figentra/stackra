/**
 * Stackra file contract:
 * Purpose: the KpiGroup route of @figentra/playground: its path, title and category. The page it renders is
 *          `pro-kpi-group.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0310 (decision 12); STA-416 FR-012.
 */
import type { PageCategory } from "#src/enums/page-category.enum";

/** The `@stackra/ui-pro` KpiGroup page, at `/pro-kpi-group`. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class ProKpiGroupRoute extends Route({ path: "/pro-kpi-group" }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static fields
export class ProKpiGroupRoute {
  /** The URL path of the route: `/` and the folder name, which the e2e suite relies on. */
  static readonly path = "/pro-kpi-group";

  /** The page title, the component's name. */
  static readonly title = "KpiGroup";

  /** The category the page is listed under: the `@stackra/ui-pro` pages. */
  static readonly category: PageCategory = "Data display";
}
