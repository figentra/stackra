/**
 * Stackra file contract:
 * Purpose: the Widget route of @figentra/playground: its path, title and category. The page it renders is
 *          `pro-widget.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0310 (decision 12); STA-416 FR-012.
 */
import type { PageCategory } from "#src/enums/page-category.enum";

/** The `@stackra/ui-pro` Widget page, at `/pro-widget`. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class ProWidgetRoute extends Route({ path: "/pro-widget" }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static fields
export class ProWidgetRoute {
  /** The URL path of the route: `/` and the folder name, which the e2e suite relies on. */
  static readonly path = "/pro-widget";

  /** The page title, the component's name. */
  static readonly title = "Widget";

  /** The category the page is listed under: the `@stackra/ui-pro` pages. */
  static readonly category: PageCategory = "Pro";
}
