/**
 * Stackra file contract:
 * Purpose: `DEV_TASK_PREFIX`, the label prefix of the VS Code tasks `stackra gen` owns in `.vscode/tasks.json`: one
 *          `dev: <name>` task per server of `.claude/launch.json`.
 * Boundary: data only; a task labelled otherwise stays hand-written.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5, amendment of 2026-11-03); STA-2081.
 */

/** The label prefix of the generated dev-server tasks. */
export const DEV_TASK_PREFIX = "dev: ";
