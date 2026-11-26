/**
 * Stackra file contract:
 * Purpose: `DocsSourcePaths`, where a docs site's authored source lives, relative to the member root, so the refusals,
 *          warnings and generated-file headers of `emitDocsSite` name the files the author actually edits: the source
 *          folder, the pages, assets and snippets, the file the settings live in and where the navigation lives. A
 *          docs app keeps `src/`, `src/docs`, `src/assets`, `src/snippets` and `src/config/docs.config.ts` for both
 *          (`DOCS_APP_SOURCE`); a docs member keeps `content/`, `content/assets`, `content/snippets`, `docs.yaml` and
 *          `content/**\/meta.json` (`DOCS_MEMBER_SOURCE`).
 * Boundary: a type only; labels for messages, never read from disk by `emitDocsSite`.
 * Runtime: isomorphic
 * Governing contract: ADR 0002 (2026-10-27 amendment); ADR 0514 (amendment of 2026-11-09: the docs member).
 */

/** Where a docs site's authored source lives, relative to the member root. */
export type DocsSourcePaths = {
  /** The folder that holds the whole source (`src`, `content`). */
  readonly root: string;

  /** The folder of the pages (`src/docs`, `content`). */
  readonly pages: string;

  /** The folder of the assets (`src/assets`, `content/assets`). */
  readonly assets: string;

  /** The folder of the snippets (`src/snippets`, `content/snippets`). */
  readonly snippets: string;

  /** The file the site settings live in (`src/config/docs.config.ts`, `docs.yaml`). */
  readonly config: string;

  /** Where the navigation lives (`src/config/docs.config.ts`, `content/**\/meta.json`). */
  readonly navigation: string;
};
