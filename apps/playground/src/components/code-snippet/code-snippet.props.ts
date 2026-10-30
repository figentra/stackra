/**
 * Stackra file contract:
 * Purpose: `CodeSnippetProps`, props of the playground's highlighted code panel.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0461 (core shows free components only).
 */
/** Props of `CodeSnippet`. */
export interface CodeSnippetProps {
  /** The source, highlighted as TSX; past 30 lines it collapses behind "Show all". */
  readonly code: string;
  /** The text at the start of the header bar (a file or package name); the language tag shows either way. */
  readonly title?: string | undefined;
  /** The copy button's accessible name; no copy button when absent. */
  readonly copyLabel?: string;
}
