/**
 * Stackra file contract:
 * Purpose: `DocsMetaInput`, what `navigationOfMeta` reads to build a docs member's navigation: the site name, the page
 *          ids under `content/` (translations left out), the folders that exist there, and each folder's parsed
 *          `meta.json`.
 * Boundary: a type only; `readDocsMember` reads it from disk, so `navigationOfMeta` stays pure. Paths are relative to
 *           `content/`, `/`-separated, with `content/assets` and `content/snippets` left out.
 * Runtime: isomorphic
 * Governing contract: ADR 0514 (amendment of 2026-11-09: the docs member).
 */

/** The input of `navigationOfMeta`. */
export type DocsMetaInput = {
  /** The site name, the title of the first tab when the root `meta.json` has none. */
  readonly name: string;

  /** Every page id: its path under `content/` without the extension (`index`, `adr/index`, `guides/setup`). */
  readonly pages: readonly string[];

  /** Every folder under `content/` (`adr`, `guides/advanced`); a page's folders are added when missing. */
  readonly folders: readonly string[];

  /** Each folder's `meta.json` as parsed JSON, by folder (`""` for `content/meta.json`). */
  readonly metas: Readonly<Record<string, unknown>>;
};
