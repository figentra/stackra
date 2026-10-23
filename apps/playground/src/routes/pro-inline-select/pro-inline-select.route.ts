/**
 * Stackra file contract:
 * Purpose: the InlineSelect route of @figentra/playground: its path, title and category. The page it renders is
 *          `pro-inline-select.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5); ADR 0310 (decision 6).
 */
import type { PageCategory } from "#src/enums/page-category.enum";

/** The `@stackra/ui-pro` InlineSelect page, at `/pro-inline-select`. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class ProInlineSelectRoute extends Route({ path: "/pro-inline-select" }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static fields
export class ProInlineSelectRoute {
  /** The URL path of the route: `/` and the folder name, which the e2e suite relies on. */
  static readonly path = "/pro-inline-select";

  /** The page title, the component's name. */
  static readonly title = "InlineSelect";

  /** The category the page is listed under: the `@stackra/ui-pro` pages. */
  static readonly category: PageCategory = "Pro";
}
