/**
 * Stackra file contract:
 * Purpose: `CodeToken`, one run of highlighted code: its text and its syntax role (none for plain text).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */
import type { SyntaxRole } from "@stackra/tokens/contracts";

/** A run of code text in one syntax role. */
export interface CodeToken {
  /** The source text of the run. */
  readonly text: string;
  /** The colour role, `--syntax-<role>`; plain text when absent. */
  readonly role?: SyntaxRole | undefined;
}
