/**
 * Stackra file contract:
 * Purpose: `DocsSiteInput`, everything `emitDocsSite` needs: the fields of the app's `DocsConfig`, every file under
 *          the member's `src/` (with the text of each page and snippet), and the committed manifests of the services
 *          the site carries the API reference of.
 * Boundary: a type only; `generateDocsSite` reads it from disk, so `emitDocsSite` stays pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0002 (2026-10-27 amendment); STA-1316.
 */
import type { StackraManifest } from "@stackra/contracts";

import type { DocsConfig } from "#core/bases/docs-config.base";

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
    | "raw"
  >;

  /** Every file under `src/`, by its path relative to `src/` (`docs/guides/x.mdx`); the text of `.md` and `.mdx`. */
  readonly files: readonly { readonly path: string; readonly content?: string }[];

  /** The committed manifests of the `apiReference` services that were found, by service key. */
  readonly services: readonly { readonly member: string; readonly manifest: StackraManifest }[];
};
