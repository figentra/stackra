/**
 * Stackra file contract:
 * Purpose: `DocsSiteInput`, everything `emitDocsSite` needs: the site settings and navigation, every source file (with
 *          the text of each page and snippet), the committed manifests of the services the site carries the API
 *          reference of, and where the source lives for the messages. Two inputs produce it: a docs app (the fields
 *          of its `DocsConfig`, the files under `src/`), and since ADR 0514's amendment of 2026-11-09 a docs member
 *          (`docs.yaml`, the navigation from `content/**\/meta.json`, the files under `content/` mapped to the same
 *          layout).
 * Boundary: a type only; `generateDocsSite` reads it from disk, so `emitDocsSite` stays pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0002 (2026-10-27 amendment); STA-1316; ADR 0514 (amendment of 2026-11-09).
 */
import type { StackraManifest } from "@stackra/contracts";

import type { DocsConfig } from "#core/bases/docs-config.base";
import type { DocsSourcePaths } from "#core/types/docs-source-paths.type";

/** The input of one docs-site run. */
export type DocsSiteInput = {
  /** The fields of the app's `DocsConfig` instance. */
  readonly config: Pick<
    DocsConfig,
    | "name"
    | "description"
    | "theme"
    | "colors"
    | "logo"
    | "favicon"
    | "navigation"
    | "navbar"
    | "footer"
    | "apiReference"
    | "redirects"
    | "raw"
  > & {
    /** The site's languages; one language (the pages as written) when absent or empty. */
    readonly locales?: DocsConfig["locales"];
  };

  /**
   * Every source file, by its path in the docs app layout (relative to `src/`: `docs/guides/x.mdx`, `assets/…`,
   * `snippets/…`); the text of `.md` and `.mdx`.
   */
  readonly files: readonly { readonly path: string; readonly content?: string }[];

  /** The committed manifests of the `apiReference` services that were found, by service key. */
  readonly services: readonly { readonly member: string; readonly manifest: StackraManifest }[];

  /** Where the source lives, for the messages and headers; a docs app's paths (`DOCS_APP_SOURCE`) when absent. */
  readonly source?: DocsSourcePaths;
};
