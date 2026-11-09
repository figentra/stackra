/**
 * Stackra file contract:
 * Purpose: `VSCODE_TASKS_FILE`, VS Code's task list, relative to the repository root, where `stackra gen` owns the
 *          `dev: <name>` tasks (`DEV_TASK_PREFIX`).
 * Boundary: data only. Every other task in the file stays hand-written; gen keeps the file's leading comment lines.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5, amendment of 2026-11-03); STA-2081.
 */

/** VS Code's task list, relative to the repository root. */
export const VSCODE_TASKS_FILE = ".vscode/tasks.json";
