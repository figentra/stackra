/**
 * Stackra file contract:
 * Purpose: the progress bar route of @figentra/playground: its path, title and category. The page it renders is
 *          `progress-bar.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

import type { PageCategory } from "#src/enums/page-category.enum";

/** The ProgressBar page, at `/progress-bar`. */
export class ProgressBarRoute extends Route({ path: "/progress-bar" }) {
  /** The page title. */
  static readonly title = "Progress bar";

  /** The category the page is listed under. */
  static readonly category: PageCategory = "Feedback and status";
}
