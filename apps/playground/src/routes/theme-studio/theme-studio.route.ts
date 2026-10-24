/**
 * Stackra file contract:
 * Purpose: the Theme Studio route of @figentra/playground: its path and title. It names no category, so the gallery
 *          and the palette list it apart from the component pages; the shell's bar and the index link to it.
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0320 (the Theme Studio).
 */

/** The Theme Studio, at `/theme-studio`. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class ThemeStudioRoute extends Route({ path: "/theme-studio" }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static fields
export class ThemeStudioRoute {
  /** The URL path of the route: `/` and the folder name, which the e2e suite relies on. */
  static readonly path = "/theme-studio";

  /** The page title. */
  static readonly title = "Theme Studio";
}
