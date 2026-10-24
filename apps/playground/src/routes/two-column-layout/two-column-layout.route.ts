/**
 * Stackra file contract:
 * Purpose: the two-column-layout route of @figentra/playground: its path, title and category. The page it renders is
 *          `two-column-layout.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import type { PageCategory } from "#src/enums/page-category.enum";

/** The TwoColumnLayout page, at `/two-column-layout`. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class TwoColumnLayoutRoute extends Route({ path: "/two-column-layout" }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static fields
export class TwoColumnLayoutRoute {
  /** The URL path of the route: `/` and the folder name, which the e2e suite relies on. */
  static readonly path = "/two-column-layout";

  /** The page title. */
  static readonly title = "Two column layout";

  /** The category the page is listed under. */
  static readonly category: PageCategory = "Layout";
}
