/**
 * Stackra file contract:
 * Purpose: the list route of @figentra/playground: its path, title and category. The page it renders is
 *          `list.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

import type { PageCategory } from "#src/enums/page-category.enum";

/** The List page, at `/list`. */
export class ListRoute extends Route({ path: "/list" }) {
  /** The page title. */
  static readonly title = "List";

  /** The category the page is listed under. */
  static readonly category: PageCategory = "Data display";
}
