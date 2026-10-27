/**
 * Stackra file contract:
 * Purpose: `DocsSite`, what `emitDocsSite` returns: its refusals, the text files of the Mintlify root (paths relative
 *          to `.stackra/site/`) and the binary files to copy from `src/` unchanged.
 * Boundary: a type only. When `errors` is not empty, `files` and `copies` are empty.
 * Runtime: isomorphic
 * Governing contract: ADR 0002 (2026-10-27 amendment); ADR 0294 (decision 22: every refusal has a code and a fix).
 */
import type { GenError } from "#core/types/gen-error.type";
import type { GeneratedFile } from "#core/types/generated-file.type";

/** One assembled site. */
export type DocsSite = {
  /** The refusals; when there is one, nothing is assembled. */
  readonly errors: readonly GenError[];

  /** `docs.json`, `llms.txt`, the pages, the snippets and the API reference, sorted by path. */
  readonly files: readonly GeneratedFile[];

  /** The assets, copied byte for byte: `from` relative to `src/`, `to` relative to the site root. */
  readonly copies: readonly { readonly from: string; readonly to: string }[];
};
