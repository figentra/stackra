/**
 * Stackra file contract:
 * Purpose: the CellSlider route of @figentra/playground: its path, title and category. The page it renders is
 *          `pro-cell-slider.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5); ADR 0310 (decision 6).
 */
import type { PageCategory } from "#src/enums/page-category.enum";

/** The `@stackra/ui-pro` CellSlider page, at `/pro-cell-slider`. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class ProCellSliderRoute extends Route({ path: "/pro-cell-slider" }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static fields
export class ProCellSliderRoute {
  /** The URL path of the route: `/` and the folder name, which the e2e suite relies on. */
  static readonly path = "/pro-cell-slider";

  /** The page title, the component's name. */
  static readonly title = "CellSlider";

  /** The category the page is listed under: the `@stackra/ui-pro` pages. */
  static readonly category: PageCategory = "Pro";
}
