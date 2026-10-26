/**
 * Stackra file contract:
 * Purpose: the Assistant panel route of @figentra/playground: its path, title and category. The page it renders is
 *          `pro-assistant-panel.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0310 (decision 12); STA-803.
 */
import type { PageCategory } from "#src/enums/page-category.enum";

/** The `@stackra-pro/ui` Assistant panel page, at `/pro-assistant-panel`. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class ProAssistantPanelRoute extends Route({ path: "/pro-assistant-panel" }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static fields
export class ProAssistantPanelRoute {
  /** The URL path of the route: `/` and the folder name, which the e2e suite relies on. */
  static readonly path = "/pro-assistant-panel";

  /** The page title, the component's name. */
  static readonly title = "Assistant panel";

  /** The category the page is listed under. */
  static readonly category: PageCategory = "AI";
}
