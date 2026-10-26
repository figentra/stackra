/**
 * Stackra file contract:
 * Purpose: the Environment banner route of @figentra/playground: its path, title and category. The page it renders is
 *          `environment-banner.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0310 (decision 12); STA-803.
 */
import type { PageCategory } from "#src/enums/page-category.enum";

/** The `@stackra/ui` Environment banner page, at `/environment-banner`. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class EnvironmentBannerRoute extends Route({ path: "/environment-banner" }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static fields
export class EnvironmentBannerRoute {
  /** The URL path of the route: `/` and the folder name, which the e2e suite relies on. */
  static readonly path = "/environment-banner";

  /** The page title, the component's name. */
  static readonly title = "Environment banner";

  /** The category the page is listed under. */
  static readonly category: PageCategory = "Feedback and status";
}
