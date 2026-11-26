/**
 * Stackra file contract:
 * Purpose: `DOCS_MEMBER_SOURCE`, the source paths of a docs member (a workspace member whose `package.json` has
 *          `"stackra": { "kind": "docs" }`): pages under `content/`, assets in `content/assets`, snippets in
 *          `content/snippets`, the settings in `docs.yaml` and the navigation in each folder's `meta.json`.
 * Boundary: a constant.
 * Runtime: isomorphic
 * Governing contract: ADR 0514 (amendment of 2026-11-09: the docs member).
 */
import type { DocsSourcePaths } from "#core/types/docs-source-paths.type";

/** Where a docs member's source lives. */
export const DOCS_MEMBER_SOURCE: DocsSourcePaths = {
  root: "content",
  pages: "content",
  assets: "content/assets",
  snippets: "content/snippets",
  config: "docs.yaml",
  navigation: "content/**/meta.json",
};
