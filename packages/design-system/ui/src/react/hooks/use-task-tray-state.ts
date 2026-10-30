/**
 * Stackra file contract:
 * Purpose: `useTaskTrayState(props, format)`, the state every runtime's TaskTray shares: collapsed or open (controlled
 *          or its own), the headline ("2 running · 1 failed", or the finished count once nothing runs), how many tasks
 *          finished, and the word under each task: its own detail, else its percent while it runs, else its state.
 * Boundary: a React hook with no rendering; the runtimes draw the tray and its rows. The web and native TaskTray both
 *           use it, before they return nothing for an empty tray.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import { useState } from "react";

import type { TaskTrayContractProps } from "#contracts/types/task-tray-contract-props.type";
import type { TaskTrayTask } from "#contracts/types/task-tray-task.type";
import { TASK_TRAY_KEYS } from "#core/constants/task-tray-keys.constant";
import { taskTrayCountsOf } from "#core/functions/task-tray-counts-of.function";
import { useUiText } from "#react/hooks/use-ui-text";

/** The tray's keys. */
const K = TASK_TRAY_KEYS.ui.task_tray;

/**
 * The shared TaskTray state.
 * @param props - the tasks and the collapsed state, controlled or not
 * @param format - the runtime's number writer, for the customer's digits
 * @returns whether the tray is collapsed, its toggle, the headline, the finished count and each task's word
 */
export function useTaskTrayState(
  {
    tasks,
    isCollapsed: collapsedProp,
    defaultCollapsed = false,
    onCollapsedChange,
  }: Pick<
    TaskTrayContractProps,
    "tasks" | "isCollapsed" | "defaultCollapsed" | "onCollapsedChange"
  >,
  format: (value: number, options?: Intl.NumberFormatOptions) => string,
): {
  readonly isCollapsed: boolean;
  readonly toggle: () => void;
  readonly headline: string;
  readonly finished: number;
  readonly wordOf: (task: TaskTrayTask) => string;
} {
  const t = useUiText();
  const [own, setOwn] = useState(defaultCollapsed);
  const isCollapsed = collapsedProp ?? own;
  const { running, finished, failed } = taskTrayCountsOf(tasks);
  return {
    isCollapsed,
    toggle: () => {
      setOwn(!isCollapsed);
      onCollapsedChange?.(!isCollapsed);
    },
    headline: [
      running > 0
        ? t(K.running, { count: running, n: format(running) })
        : t(K.finished, { count: finished, n: format(finished) }),
      failed > 0 ? t(K.failed, { count: failed, n: format(failed) }) : "",
    ]
      .filter(Boolean)
      .join(" · "),
    finished,
    wordOf: (task) =>
      task.detail ??
      (task.status === "running"
        ? task.progress === undefined
          ? ""
          : format(task.progress / 100, { style: "percent" })
        : t(K[task.status === "queued" ? "queued" : task.status])),
  };
}
