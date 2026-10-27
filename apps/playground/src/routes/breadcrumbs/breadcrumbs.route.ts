/**
 * Stackra file contract:
 * Purpose: the breadcrumbs route of @figentra/playground: its path, title and category. The page it renders is
 *          `breadcrumbs.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

import type { PageCategory } from "#src/enums/page-category.enum";

/** The Breadcrumbs page, at `/breadcrumbs`. */
export class BreadcrumbsRoute extends Route({ path: "/breadcrumbs" }) {
  /** The page title. */
  static readonly title = "Breadcrumbs";

  /** The category the page is listed under. */
  static readonly category: PageCategory = "Navigation";
}
