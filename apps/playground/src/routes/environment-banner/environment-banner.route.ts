/**
 * Stackra file contract:
 * Purpose: the Environment banner route of @figentra/playground: its path, title and category. The page it renders is
 *          `environment-banner.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0310 (decision 12); STA-803.
 */
import { Route } from "@stackra/navigation";

import type { PageCategory } from "#src/enums/page-category.enum";

/** The `@stackra/ui` Environment banner page, at `/environment-banner`. */
export class EnvironmentBannerRoute extends Route({ path: "/environment-banner" }) {
  /** The page title, the component's name. */
  static readonly title = "Environment banner";

  /** The category the page is listed under. */
  static readonly category: PageCategory = "Feedback and status";
}
