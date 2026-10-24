/**
 * Stackra file contract:
 * Purpose: the progress circle route of @figentra/playground: its path, title and category. The page it renders is
 *          `progress-circle.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import type { PageCategory } from "#src/enums/page-category.enum";

/** The ProgressCircle page, at `/progress-circle`. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class ProgressCircleRoute extends Route({ path: "/progress-circle" }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static fields
export class ProgressCircleRoute {
  /** The URL path of the route: `/` and the folder name, which the e2e suite relies on. */
  static readonly path = "/progress-circle";

  /** The page title. */
  static readonly title = "Progress circle";

  /** The category the page is listed under. */
  static readonly category: PageCategory = "Feedback and status";
}
