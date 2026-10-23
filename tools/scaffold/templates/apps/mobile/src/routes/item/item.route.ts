/**
 * Stackra file contract:
 * Purpose: the item route of @figentra/{{NAME}}: its deep-link path with the `id` param. The page is `item.tsx`
 *          beside it; gen pairs the two by folder (ADR 0294 decision 14).
 * Boundary: route declaration only.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7).
 */

/** One item, pushed over the tabs. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class ItemRoute extends Route({ path: "items/:id" }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static field
export class ItemRoute {
  /** The deep-link path of the route. */
  static readonly path = "items/:id";
}
