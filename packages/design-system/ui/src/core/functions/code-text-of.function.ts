/**
 * Stackra file contract:
 * Purpose: `codeTextOf`, the text a code block copies: its rows without the deleted ones, so a diff copies the result.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: STA-1371.
 */
import type { CodeRow } from "#core/types/code-row.type";

/** The copied text of `rows`. */
export function codeTextOf(rows: readonly CodeRow[]): string {
  return rows
    .filter((row) => row.change !== "deleted")
    .map((row) => row.tokens.map((token) => token.text).join(""))
    .join("\n");
}
