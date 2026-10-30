/**
 * Stackra file contract:
 * Purpose: `taskTrayCountsOf(tasks)`, what a TaskTray's header says: how many tasks are under way (queued or
 *          running), how many have finished (done, failed or canceled) and how many of those failed.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { TaskTrayTask } from "#contracts/types/task-tray-task.type";

/**
 * Counts the tasks by state.
 * @param tasks - the tray's tasks
 * @returns the running, finished and failed counts
 */
export function taskTrayCountsOf(tasks: readonly TaskTrayTask[]): {
  readonly running: number;
  readonly finished: number;
  readonly failed: number;
} {
  const running = tasks.filter((task) => task.status === "queued" || task.status === "running");
  return {
    running: running.length,
    finished: tasks.length - running.length,
    failed: tasks.filter((task) => task.status === "error").length,
  };
}
