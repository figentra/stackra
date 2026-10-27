/**
 * Stackra file contract:
 * Purpose: the KpiGroup route of @figentra/playground: its path, title and category. The page it renders is
 *          `pro-kpi-group.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0310 (decision 12); STA-416 FR-012.
 */
import { Route } from "@stackra/navigation";

import type { PageCategory } from "#src/enums/page-category.enum";

/** The `@stackra-pro/ui` KpiGroup page, at `/pro-kpi-group`. */
export class ProKpiGroupRoute extends Route({ path: "/pro-kpi-group" }) {
  /** The page title, the component's name. */
  static readonly title = "KpiGroup";

  /** The category the page is listed under: the `@stackra-pro/ui` pages. */
  static readonly category: PageCategory = "Data display";
}
