/**
 * Stackra file contract:
 * Purpose: the TrendChip route of @figentra/playground: its path, title and navigation group. The page it renders is
 *          `pro-trend-chip.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5); ADR 0304 (decision 6).
 */

/** The `@stackra/ui-pro` TrendChip page, at `/pro-trend-chip`. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class ProTrendChipRoute extends Route({ path: "/pro-trend-chip" }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static fields
export class ProTrendChipRoute {
  /** The URL path of the route: `/` and the folder name, which the e2e suite relies on. */
  static readonly path = "/pro-trend-chip";

  /** The page title, the component's name. */
  static readonly title = "TrendChip";

  /** The navigation group of the `@stackra/ui-pro` pages. */
  static readonly group = "Pro";
}
