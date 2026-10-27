/**
 * Stackra file contract:
 * Purpose: the icon-button route of @figentra/playground: its path, title and category. The page it renders is `icon-button.tsx`
 *          beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

import type { PageCategory } from "#src/enums/page-category.enum";

/** The Icon button page, at `/icon-button`. */
export class IconButtonRoute extends Route({ path: "/icon-button" }) {
  /** The page title. */
  static readonly title = "Icon button";

  /** The category the page is listed under. */
  static readonly category: PageCategory = "Actions";
}
