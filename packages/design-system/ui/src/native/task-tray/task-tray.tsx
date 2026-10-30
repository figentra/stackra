/**
 * Stackra file contract:
 * Purpose: the native `TaskTray`: the app's background tasks in one card docked above the bottom end corner, as on
 *          web: a header with the counts (under way, finished, failed), "Clear finished" and a fold button; a row per
 *          task with its icon or state mark, name, a line of detail, a bar while it runs, and cancel, retry or remove.
 * Boundary: draws nothing while `tasks` is empty. The header's count is a polite live region; the fold button reports
 *           expanded or collapsed. `docked` is absolutely placed at the inline end of its parent (the screen), so it
 *           mirrors in Arabic; `inline` leaves it in the flow. Folding is instant, so there is no motion to reduce.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060; STA-1371 (owner request 2026-10-29).
 */
import { useState, type ReactElement } from "react";
import { View } from "react-native";

import type { TaskTrayTask } from "#contracts/types/task-tray-task.type";
import { TASK_TRAY_KEYS } from "#core/constants/task-tray-keys.constant";
import { taskTrayCountsOf } from "#core/functions/task-tray-counts-of.function";
import { isolatedFileNameOf } from "#core/functions/isolated-file-name-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import { useNumberFormat } from "#native/hooks/use-number-format";
import { Icon } from "#native/icon/icon";
import { IconButton } from "#native/icon-button/icon-button";
import { ProgressBar } from "#native/progress-bar/progress-bar";
import { SlotIcon } from "#native/slot-icon/slot-icon";
import type { TaskTrayProps } from "#native/task-tray/task-tray.props";
import { Text } from "#native/text/text";

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
  const [own, setOwn] = useState(defaultCollapsed);
  const isCollapsed = collapsedProp ?? own;
  if (tasks.length === 0) return null;

  const { running, finished, failed } = taskTrayCountsOf(tasks);
  const headline = [
    running > 0
      ? t(K.running, { count: running, n: format(running) })
      : t(K.finished, { count: finished, n: format(finished) }),
    failed > 0 ? t(K.failed, { count: failed, n: format(failed) }) : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const word = (task: TaskTrayTask) =>
    task.detail ??
    (task.status === "running"
      ? task.progress === undefined
        ? ""
        : format(task.progress / 100, { style: "percent" })
      : t(K[task.status === "queued" ? "queued" : task.status]));

  return (
    <View
      accessibilityLabel={label ?? t(K.label)}
      className={`overflow-hidden rounded-[var(--radius-container)] border border-separator bg-overlay shadow-overlay ${
        placement === "docked" ? "absolute end-4 bottom-4 start-4" : "w-full"
      } ${className ?? ""}`}
    >
      <View className="flex-row items-center gap-2 py-2 ps-4 pe-2">
        <Text accessibilityLiveRegion="polite" className="flex-1 font-medium" numberOfLines={1}>
          {headline}
        </Text>
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
          accessibilityState={{ expanded: !isCollapsed }}
          onPress={() => {
            setOwn(!isCollapsed);
            onCollapsedChange?.(!isCollapsed);
          }}
        />
      </View>
      {isCollapsed ? null : (
        <View className="max-h-80 border-t border-separator">
          {tasks.map((task, index) => {
            const isActive = task.status === "queued" || task.status === "running";
            return (
              <View
                key={task.id}
                className={`gap-2 px-4 py-3 ${index > 0 ? "border-t border-separator" : ""}`}
              >
                <View className="flex-row items-center gap-3">
                  <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    {isActive ? <SlotIcon icon={task.icon ?? "clock"} /> : MARK[task.status]}
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text numberOfLines={1}>{isolatedFileNameOf(task.label)}</Text>
                    <Text type="small" tone={task.status === "error" ? "danger" : "muted"}>
                      {word(task)}
                    </Text>
                  </View>
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
                </View>
                {task.status === "running" ? (
                  <ProgressBar
                    size="sm"
                    label={task.label}
                    {...(task.progress === undefined ? {} : { value: task.progress })}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
