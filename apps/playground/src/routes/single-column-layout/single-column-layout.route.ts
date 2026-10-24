/**
 * Stackra file contract:
 * Purpose: the single-column-layout route of @figentra/playground: its path, title and category. The page it renders
 *          is `single-column-layout.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import type { PageCategory } from "#src/enums/page-category.enum";

/** The SingleColumnLayout page, at `/single-column-layout`. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class SingleColumnLayoutRoute extends Route({ path: "/single-column-layout" }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static fields
export class SingleColumnLayoutRoute {
  /** The URL path of the route: `/` and the folder name, which the e2e suite relies on. */
  static readonly path = "/single-column-layout";

  /** The page title. */
  static readonly title = "Single column layout";

  /** The category the page is listed under. */
  static readonly category: PageCategory = "Layout";
}
