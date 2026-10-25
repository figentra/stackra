/**
 * Stackra file contract:
 * Purpose: `issuesOf`, the issues of a failed zod parse: each issue's dotted path (under an optional prefix) and
 *          message, in document order.
 * Boundary: internal; shared by `parseEdge` and `parseCloudflareStack`.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (enforcement: each failure is named).
 */
import type { RunwayIssue } from "@stackra/runway";
import type { z } from "zod";

/**
 * The issues of `error`, each path under `prefix` when given.
 *
 * @example
 * issuesOf(result.error, "edge"); // [{ path: "edge.bots.mode", message: "Invalid option: …" }]
 */
export function issuesOf(error: z.ZodError, prefix?: string): RunwayIssue[] {
  return error.issues.map((issue) => ({
    path: [...(prefix === undefined ? [] : [prefix]), ...issue.path.map(String)].join("."),
    message: issue.message,
  }));
}
