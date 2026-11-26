/**
 * Stackra file contract:
 * Purpose: `DOCS_APP_SOURCE`, the source paths of a docs app (a member with `src/config/docs.config.ts`): pages in
 *          `src/docs`, assets in `src/assets`, snippets in `src/snippets`, settings and navigation in the config file.
 *          `emitDocsSite` names these in its messages when its input carries no `source`.
 * Boundary: a constant.
 * Runtime: isomorphic
 * Governing contract: ADR 0002 (2026-10-27 amendment); ADR 0514 (amendment of 2026-11-09).
 */
import { DOCS_CONFIG_FILE } from "#core/constants/docs-config-file.constant";
import type { DocsSourcePaths } from "#core/types/docs-source-paths.type";

/** Where a docs app's source lives. */
export const DOCS_APP_SOURCE: DocsSourcePaths = {
  root: "src",
  pages: "src/docs",
  assets: "src/assets",
  snippets: "src/snippets",
  config: DOCS_CONFIG_FILE,
  navigation: DOCS_CONFIG_FILE,
};
