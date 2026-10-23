/**
 * Stackra file contract:
 * Purpose: the home route of @figentra/{{NAME}}: its deep-link path. The page is `home.tsx` beside it; gen pairs
 *          the two by folder and builds the navigators (ADR 0294 decision 14, ADR 0295 decision 12).
 * Boundary: route declaration only.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7).
 */

/** The Home tab's root, at the app's base URL. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class HomeRoute extends Route({ path: "", tab: { order: 1, icon: "house" } }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static field
export class HomeRoute {
  /** The deep-link path of the route. */
  static readonly path = "";
}
