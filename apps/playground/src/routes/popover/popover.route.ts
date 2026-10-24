/**
 * Stackra file contract:
 * Purpose: the popover route of @figentra/playground: its path, title and category. The page it renders is `popover.tsx`
 *          beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import type { PageCategory } from "#src/enums/page-category.enum";

/** The Popover page, at `/popover`. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class PopoverRoute extends Route({ path: "/popover" }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static fields
export class PopoverRoute {
  /** The URL path of the route: `/` and the folder name, which the e2e suite relies on. */
  static readonly path = "/popover";

  /** The page title. */
  static readonly title = "Popover";

  /** The category the page is listed under. */
  static readonly category: PageCategory = "Overlays";
}
