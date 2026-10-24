/**
 * Stackra file contract:
 * Purpose: the CellColorPicker route of @figentra/playground: its path, title and category. The page it renders is
 *          `pro-cell-color-picker.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5); ADR 0310 (decision 6).
 */
import type { PageCategory } from "#src/enums/page-category.enum";

/** The `@stackra/ui-pro` CellColorPicker page, at `/pro-cell-color-picker`. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class ProCellColorPickerRoute extends Route({ path: "/pro-cell-color-picker" }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static fields
export class ProCellColorPickerRoute {
  /** The URL path of the route: `/` and the folder name, which the e2e suite relies on. */
  static readonly path = "/pro-cell-color-picker";

  /** The page title, the component's name. */
  static readonly title = "CellColorPicker";

  /** The category the page is listed under: the `@stackra/ui-pro` pages. */
  static readonly category: PageCategory = "Inputs and forms";
}
