/**
 * Stackra file contract:
 * Purpose: the AppLayout route of @figentra/playground: its path, title and navigation group, and that it draws its
 *          own `main` landmark. The page it renders is `pro-app-layout.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5); ADR 0304 (decision 6).
 */

/** The `@stackra/ui-pro` AppLayout page, at `/pro-app-layout`. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class ProAppLayoutRoute extends Route({ path: "/pro-app-layout" }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static fields
export class ProAppLayoutRoute {
  /** The URL path of the route: `/` and the folder name, which the e2e suite relies on. */
  static readonly path = "/pro-app-layout";

  /** The page title, the component's name. */
  static readonly title = "AppLayout";

  /** The navigation group of the `@stackra/ui-pro` pages. */
  static readonly group = "Pro";

  /** AppLayout draws its own `main`, so the shell adds none around this page. */
  static readonly ownsMain = true;
}
