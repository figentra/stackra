/**
 * Stackra file contract:
 * Purpose: the syntax colour roles a code block paints its tokens in, written as `--syntax-<role>` on web and native.
 * Boundary: the role names only; the colours come from `syntaxColours`, the tokenizer lives in @stackra/ui.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); WCAG 2.2 SC 1.4.3; STA-1371.
 */

// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128), as ColorRole.
export const SyntaxRole = Object.freeze([
  "keyword",
  "string",
  "number",
  "function",
  "type",
  "variable",
  "comment",
  "punctuation",
  "tag",
  "attribute",
  "operator",
  "inserted",
  "deleted",
] as const);

/** One syntax colour role. */
export type SyntaxRole = (typeof SyntaxRole)[number];
