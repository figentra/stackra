/**
 * Stackra file contract:
 * Purpose: `DocsMember`, a docs member read from disk for `emitDocsSite`: its settings (`docs.yaml`) with the
 *          navigation of its `meta.json` files, every file under `content/` mapped to the docs app layout the emitter
 *          reads, where that source lives (`DOCS_MEMBER_SOURCE`), and the way back from an emitter copy path to the
 *          real file.
 * Boundary: a type only; `readDocsMember` builds it, `generateDocsSite` consumes it.
 * Runtime: node
 * Governing contract: ADR 0514 (amendment of 2026-11-09: the docs member).
 */
import type { DocsSiteInput } from "#core/types/docs-site-input.type";
import type { DocsSourcePaths } from "#core/types/docs-source-paths.type";

/** A docs member, ready for `emitDocsSite`. */
export type DocsMember = {
  /** The `docs.yaml` settings, with `navigation` from `content/**\/meta.json`. */
  readonly config: DocsSiteInput["config"];

  /** Every file under `content/` but the `meta.json` files: `assets/**` and `snippets/**` as they are, the rest under `docs/`. */
  readonly files: DocsSiteInput["files"];

  /** Where the source lives, for the messages. */
  readonly source: DocsSourcePaths;

  /** The absolute path of the file an emitter copy's `from` names (`assets/logo.svg` is `<root>/content/assets/logo.svg`). */
  readonly resolve: (from: string) => string;
};
