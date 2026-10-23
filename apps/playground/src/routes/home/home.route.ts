/**
 * Stackra file contract:
 * Purpose: the index route of @figentra/playground: its path and title. The page it renders is `home.tsx` beside
 *          it; gen pairs the two by folder and builds the route tree (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */

/** The index of the playground's pages, at `/`. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class HomeRoute extends Route({ path: "/" }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static fields
export class HomeRoute {
  /** The URL path of the route. */
  static readonly path = "/";

  /** The page title. */
  static readonly title = "Stackra Playground";
}
