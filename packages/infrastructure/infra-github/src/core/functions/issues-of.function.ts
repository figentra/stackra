/**
 * Stackra file contract:
 * Purpose: `issuesOf(error, prefix?)`, the issues of a failed zod parse: each issue's dotted path (under `prefix` when
 *          the parsed value sits inside a larger document) and message, in document order.
 * Boundary: internal; shared by `githubPlan`, `parseRuleset` and `parseBranchProtection`.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (enforcement: each failure is named).
 */
import type { RunwayIssue } from "@stackra/runway";
import type { z } from "zod";

/**
 * The issues of `error`.
 *
 * @param prefix - the dotted path of the parsed value inside its document; empty for a whole document.
 * @example
 * issuesOf(result.error, "root.providers.github"); // [{ path: "root.providers.github.repo", message: "…" }]
 */
export function issuesOf(error: z.ZodError, prefix = ""): RunwayIssue[] {
  return error.issues.map((issue) => ({
    path: [prefix, ...issue.path.map(String)].filter((segment) => segment !== "").join("."),
    message: issue.message,
  }));
}
