/**
 * Stackra file contract:
 * Purpose: the menu route of @figentra/playground: its path, title and category. The page it renders is `menu.tsx`
 *          beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

import type { PageCategory } from "#src/enums/page-category.enum";

/** The Menu page, at `/menu`. */
export class MenuRoute extends Route({ path: "/menu" }) {
  /** The page title. */
  static readonly title = "Menu";

  /** The category the page is listed under. */
  static readonly category: PageCategory = "Overlays";
}
