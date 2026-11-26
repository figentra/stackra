/**
 * Stackra file contract:
 * Purpose: `CodemodEngines`, the two codemod libraries `stackra upgrade` loads on demand: ast-grep, which finds the
 *          nodes (and the matches it reports), and ts-morph, which edits imports and renames references.
 * Boundary: type only; `loadCodemodEngines` imports both only when an upgrade has a codemod to run, so no other
 *           command pays for them.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2: ast-grep and ts-morph); STA-145.
 */
import type * as AstGrep from "@ast-grep/napi";
import type * as TsMorph from "ts-morph";

/** The loaded libraries. */
export type CodemodEngines = {
  /** The `@ast-grep/napi` module, which finds the nodes a report codemod lists. */
  readonly astGrep: typeof AstGrep;

  /** The `ts-morph` module, which edits imports and renames references. */
  readonly tsMorph: typeof TsMorph;
};
