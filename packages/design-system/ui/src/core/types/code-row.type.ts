/**
 * Stackra file contract:
 * Purpose: `CodeRow`, one line of a code block as `codeRowsOf` gives it: its tokens, number, diff change and highlight.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */
import type { CodeToken } from "#core/types/code-token.type";

/** One line of a code block. */
export interface CodeRow {
  readonly tokens: readonly CodeToken[];
  /** The line number, from 1. */
  readonly number: number;
  /** In diff mode, a line that starts with `+` (inserted) or `-` (deleted); the marker is not in the tokens. */
  readonly change?: "inserted" | "deleted" | undefined;
  readonly isHighlighted: boolean;
}
