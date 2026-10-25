/**
 * Stackra file contract:
 * Purpose: `issuesOf`, the runway issues of a failed zod parse: each issue's dotted path and message, in document
 *          order.
 * Boundary: internal; shared by `parseRunway` and `parseRunwayFacts`.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (enforcement: each failure is named).
 */
import type { z } from "zod";

import type { RunwayIssue } from "#core/types/runway-issue.type";

/**
 * The issues of `error`.
 *
 * @example
 * issuesOf(result.error); // [{ path: "environments.dev.port", message: "Too big: expected number to be <=65535" }]
 */
export function issuesOf(error: z.ZodError): RunwayIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.map(String).join("."),
    message: issue.message,
  }));
}
