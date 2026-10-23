/**
 * Stackra file contract:
 * Purpose: the Resizable route of @figentra/playground: its path, title and navigation group. The page it renders is
 *          `pro-resizable.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0310 (decision 12); STA-416 FR-012.
 */

/** The `@stackra/ui-pro` Resizable page, at `/pro-resizable`. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class ProResizableRoute extends Route({ path: "/pro-resizable" }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static fields
export class ProResizableRoute {
  /** The URL path of the route: `/` and the folder name, which the e2e suite relies on. */
  static readonly path = "/pro-resizable";

  /** The page title, the component's name. */
  static readonly title = "Resizable";

  /** The navigation group of the `@stackra/ui-pro` pages. */
  static readonly group = "Pro";
}
