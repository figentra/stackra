/**
 * Stackra file contract:
 * Purpose: `ToolTask`, the member commands that run a tool: each is also the Turborepo task the workspace root fans
 *          out to, and the script name a member's package.json gives it.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: the task vocabulary rule (`.agents/rules/task-vocabulary.md`); ADR 0295 (decision 5).
 */

/** A command that resolves to one tool process. */
export type ToolTask = "dev" | "build" | "start" | "typecheck" | "test" | "lint";
