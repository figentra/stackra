/**
 * Stackra file contract:
 * Purpose: the Mode switch route of @figentra/playground: its path, title and category. The page it renders is
 *          `mode-switch.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0310 (decision 12); STA-803.
 */
import type { PageCategory } from "#src/enums/page-category.enum";

/** The `@stackra/ui` Mode switch page, at `/mode-switch`. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class ModeSwitchRoute extends Route({ path: "/mode-switch" }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static fields
export class ModeSwitchRoute {
  /** The URL path of the route: `/` and the folder name, which the e2e suite relies on. */
  static readonly path = "/mode-switch";

  /** The page title, the component's name. */
  static readonly title = "Mode switch";

  /** The category the page is listed under. */
  static readonly category: PageCategory = "Inputs and forms";
}
