/**
 * Stackra file contract:
 * Purpose: the home route of @figentra/{{NAME}}: its path. The page it renders is `home.tsx` beside it; gen pairs
 *          the two by folder and builds the route tree (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading yet.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7).
 */

/** The panel's landing page, at `/`. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class HomeRoute extends Route({ path: "/" }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static field
export class HomeRoute {
  /** The URL path of the route. */
  static readonly path = "/";
}
