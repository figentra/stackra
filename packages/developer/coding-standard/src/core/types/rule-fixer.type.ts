/**
 * Stackra file contract:
 * Purpose: the oxlint fixer methods the house autofixes use.
 * Boundary: a structural type matching the oxlint JS plugin API; no runtime code.
 * Runtime: isomorphic
 * Governing contract: ADR 0129 (the house rules ship as an oxlint jsPlugin); ADR 0305 (one declaration per file).
 */
import type { RuleFix } from "#core/types/rule-fix.type";

/** Builds text edits for an autofix. */
export interface RuleFixer {
  /** Inserts `text` at the end of `range`. */
  insertTextAfterRange(range: readonly [number, number], text: string): RuleFix;

  /** Replaces the text in `range`. */
  replaceTextRange(range: readonly [number, number], text: string): RuleFix;

  /** Deletes the text in `range`. */
  removeRange(range: readonly [number, number]): RuleFix;
}
