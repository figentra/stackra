/**
 * Stackra file contract:
 * Purpose: the EmojiPicker route of @figentra/playground: its path, title and navigation group. The page it renders is
 *          `pro-emoji-picker.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0310 (decision 12); STA-416 FR-012.
 */

/** The `@stackra/ui-pro` EmojiPicker page, at `/pro-emoji-picker`. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class ProEmojiPickerRoute extends Route({ path: "/pro-emoji-picker" }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static fields
export class ProEmojiPickerRoute {
  /** The URL path of the route: `/` and the folder name, which the e2e suite relies on. */
  static readonly path = "/pro-emoji-picker";

  /** The page title, the component's name. */
  static readonly title = "EmojiPicker";

  /** The navigation group of the `@stackra/ui-pro` pages. */
  static readonly group = "Pro";
}
