/**
 * Stackra file contract:
 * Purpose: `CodeGrammarRule`, one rule of a `CODE_GRAMMARS` language: a sticky pattern and the role of its match, or a
 *          function that names the role from the match and its place in the source (`plain` for no colour, `null`
 *          when the rule does not apply there).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */
import type { SyntaxRole } from "@stackra/tokens/contracts";

/** A pattern (with the `y` flag) and its role. */
export type CodeGrammarRule = readonly [
  pattern: RegExp,
  role:
    | SyntaxRole
    | "plain"
    | ((match: string, source: string, at: number) => SyntaxRole | "plain" | null),
];
