/**
 * Stackra file contract:
 * Purpose: the settings route of @figentra/{{NAME}}: its deep-link path. The page is `settings.tsx` beside it; gen
 *          pairs the two by folder (ADR 0294 decision 14).
 * Boundary: route declaration only.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7).
 */

/** The Settings tab's root. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class SettingsRoute extends Route({ path: "settings", tab: { order: 2, icon: "gearshape" } }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static field
export class SettingsRoute {
  /** The deep-link path of the route. */
  static readonly path = "settings";
}
