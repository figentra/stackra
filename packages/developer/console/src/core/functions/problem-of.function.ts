/**
 * Stackra file contract:
 * Purpose: `problemOf(error, docs)`, any thrown value as a `Problem`: its message is the title, and its own `why`,
 *          `hint`, `fix`, `docs` and `detail` fields (a `CommandError`'s, a `UsageError`'s hint) fill the rest; the
 *          command's docs link stands in when the error has none.
 * Boundary: pure; reads only string fields, so an error with none still renders in the same box.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-011.
 */
import type { Problem } from "#contracts/types/problem.type";

/** The fields a problem may take from an error. */
const FIELDS = ["why", "hint", "fix", "docs", "detail"] as const;

/** The problem of `error`. */
export function problemOf(error: unknown, docs?: string): Problem {
  const source =
    typeof error === "object" && error !== null ? (error as Record<string, unknown>) : {};
  const problem: Record<string, unknown> = {
    title: error instanceof Error ? error.message : String(error),
    error,
  };
  for (const field of FIELDS) if (typeof source[field] === "string") problem[field] = source[field];
  if (problem["docs"] === undefined && docs !== undefined) problem["docs"] = docs;
  return problem as unknown as Problem;
}
