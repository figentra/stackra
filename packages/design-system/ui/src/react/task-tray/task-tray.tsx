/**
 * Stackra file contract:
 * Purpose: the web `TaskTray`: the app's background tasks (uploads, exports, imports, any long job) in one card docked
 *          at the bottom end corner. The header says how many are under way, finished and failed, and folds the list
 *          away; each row is the task's icon or state mark, its name and a line of detail, a bar while it runs, and
 *          its buttons: cancel while queued or running, retry once failed, remove once finished. "Clear finished"
 *          sits in the header while a task has finished.
 * Boundary: draws nothing while `tasks` is empty. A region named by `label` ("Background tasks"); the header's count
 *           is a polite live region, so a finished or failed task is said without moving focus. The fold button
 *           carries `aria-expanded` and `aria-controls`. Buttons and bars are the house IconButton, Button and
 *           ProgressBar on React Aria. `docked` is `position: fixed` at the inline end, so it mirrors in Arabic;
 *           `inline` leaves it in the flow. Folding is instant, so there is no motion to reduce.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060; WCAG 2.2 SC 1.3.1, 2.1.1, 4.1.2 and 4.1.3; STA-1371 (owner
 *          request 2026-10-29).
 */
import { cn } from "@heroui/react";
import { useId, type ReactElement } from "react";

import { TASK_TRAY_KEYS } from "#core/constants/task-tray-keys.constant";
import { Button } from "#react/button/button";
import { useNumberFormat } from "#react/hooks/use-number-format";
import { FileName } from "#react/file-name/file-name";
import { useTaskTrayState } from "#react/hooks/use-task-tray-state";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import { IconButton } from "#react/icon-button/icon-button";
import { ProgressBar } from "#react/progress-bar/progress-bar";
import { SlotIcon } from "#react/slot-icon/slot-icon";
import type { TaskTrayProps } from "#react/task-tray/task-tray.props";
import { Text } from "#react/text/text";

/** The tray's keys. */
const K = TASK_TRAY_KEYS.ui.task_tray;

/** The mark of a finished task, by state. */
const MARK = {
  done: <Icon name="circle-check" tone="success" />,
  error: <Icon name="circle-alert" tone="danger" />,
  canceled: <Icon name="circle-x" tone="muted" />,
} as const;

/** The app's background tasks, docked in a corner. */
export function TaskTray({
  tasks,
  label,
  onCancel,
  onRetry,
  onDismiss,
  onClear,
  isCollapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  placement = "docked",
  className,
}: TaskTrayProps): ReactElement | null {
  const t = useUiText();
  const format = useNumberFormat();
  const listId = useId();
  const { isCollapsed, toggle, headline, finished, wordOf } = useTaskTrayState(
    { tasks, isCollapsed: collapsedProp, defaultCollapsed, onCollapsedChange },
    format,
  );
  if (tasks.length === 0) return null;
  const name = label ?? t(K.label);

  return (
    <section
      aria-label={name}
      data-slot="task-tray"
      data-placement={placement}
      className={cn(
        "overflow-hidden rounded-[var(--radius-container)] border border-separator bg-overlay text-overlay-foreground shadow-overlay",
        placement === "docked"
          ? "fixed end-4 bottom-4 z-(--z-overlay) w-[min(24rem,calc(100vw-2rem))]"
          : "w-full max-w-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2 py-2 ps-4 pe-2">
        <p aria-live="polite" className="m-0 min-w-0 flex-1 truncate text-sm font-medium">
          <bdi>{headline}</bdi>
        </p>
        {onClear && finished > 0 ? (
          <Button size="sm" variant="ghost" onPress={onClear}>
            {t(K.clear)}
          </Button>
        ) : null}
        <IconButton
          size="sm"
          variant="ghost"
          icon={isCollapsed ? "chevron-up" : "chevron-down"}
          label={isCollapsed ? t(K.show) : t(K.hide)}
          aria-expanded={!isCollapsed}
          aria-controls={listId}
          onPress={toggle}
        />
      </div>
      <ul
        id={listId}
        hidden={isCollapsed}
        aria-label={name}
        className="m-0 grid max-h-[min(28rem,60vh)] list-none overflow-y-auto border-t border-separator p-0"
      >
        {tasks.map((task) => {
          const isActive = task.status === "queued" || task.status === "running";
          return (
            <li
              key={task.id}
              data-status={task.status}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 [&+&]:border-t [&+&]:border-separator"
            >
              <span aria-hidden className="inline-flex text-muted">
                {isActive ? <SlotIcon icon={task.icon ?? "clock"} /> : MARK[task.status]}
              </span>
              <span className="grid min-w-0">
                <Text isTruncated>
                  <FileName name={task.label} />
                </Text>
                <Text type="small" tone={task.status === "error" ? "danger" : "muted"}>
                  {wordOf(task)}
                </Text>
              </span>
              <span className="flex items-center gap-1">
                {isActive && onCancel ? (
                  <IconButton
                    size="sm"
                    variant="ghost"
                    icon="x"
                    label={t(K.cancel, { name: task.label })}
                    onPress={() => onCancel(task.id)}
                  />
                ) : null}
                {task.status === "error" && onRetry ? (
                  <IconButton
                    size="sm"
                    variant="ghost"
                    icon="rotate-ccw"
                    label={t(K.retry, { name: task.label })}
                    onPress={() => onRetry(task.id)}
                  />
                ) : null}
                {!isActive && onDismiss ? (
                  <IconButton
                    size="sm"
                    variant="ghost"
                    icon="x"
                    label={t(K.dismiss, { name: task.label })}
                    onPress={() => onDismiss(task.id)}
                  />
                ) : null}
              </span>
              {task.status === "running" ? (
                <ProgressBar
                  size="sm"
                  label={task.label}
                  className="col-span-full"
                  {...(task.progress === undefined ? {} : { value: task.progress })}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
