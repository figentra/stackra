/**
 * Stackra file contract:
 * Purpose: `ErrorCodeEntry`, one row of the error-code reference (`customers/error-codes` on the docs site): the code,
 *          the tool that prints it, the group and heading anchor it sits under, what causes it and how to fix it. Gen's
 *          printed docs line, `stackra explain` and the local MCP's `explain` tool all read these rows.
 * Boundary: a type only. The rows are copied from the page by apps/docs `pnpm error-codes:write`; the page is the
 *           source, so an entry is changed there, never here.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (snake_case machine codes); ADR 0294 (decisions 22 and 26: a refusal names its code and
 *                     fix); STA-2853 (the reference page); STA-2891.
 */

/** One code of the error-code reference. */
export interface ErrorCodeEntry {
  /** The code as the tool prints it: `shape_number_kind`, `json-configs`, `RunwayLockedError`. */
  readonly code: string;

  /** The tool that prints it: the `## ` section of the page it sits under. */
  readonly tool: "gen" | "check" | "runway";

  /** The `### ` group of the page it sits under, such as `Shapes and fields`. */
  readonly group: string;

  /** The id the docs site gives that group's heading, the fragment of the code's docs link. */
  readonly anchor: string;

  /** What usually causes it, in the page's Markdown. */
  readonly cause: string;

  /** The usual fix, in the page's Markdown. */
  readonly fix: string;
}
