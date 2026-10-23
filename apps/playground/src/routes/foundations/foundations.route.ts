/**
 * Stackra file contract:
 * Purpose: the foundations route of @figentra/playground: its path, title and category. The page it renders is
 *          `foundations.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */

import type { PageCategory } from "#src/enums/page-category.enum";

/** The token foundations page, at `/foundations`. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class FoundationsRoute extends Route({ path: "/foundations" }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static fields
export class FoundationsRoute {
  /** The URL path of the route: `/` and the folder name, which the e2e suite relies on. */
  static readonly path = "/foundations";

  /** The page title. */
  static readonly title = "Foundations";

  /** The category the page is listed under. */
  static readonly category: PageCategory = "Foundations";
}
