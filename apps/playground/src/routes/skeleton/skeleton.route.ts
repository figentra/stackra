/**
 * Stackra file contract:
 * Purpose: the skeleton route of @figentra/playground: its path, title and category. The page it renders is
 *          `skeleton.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import type { PageCategory } from "#src/enums/page-category.enum";

/** The Skeleton page, at `/skeleton`. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class SkeletonRoute extends Route({ path: "/skeleton" }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static fields
export class SkeletonRoute {
  /** The URL path of the route: `/` and the folder name, which the e2e suite relies on. */
  static readonly path = "/skeleton";

  /** The page title. */
  static readonly title = "Skeleton";

  /** The category the page is listed under. */
  static readonly category: PageCategory = "Status";
}
