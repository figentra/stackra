/**
 * Stackra file contract:
 * Purpose: `TaskTrayContractProps`, the props every runtime's `TaskTray` takes: the background tasks, their buttons
 *          (cancel, retry, remove, clear finished), and whether the list is folded to its header.
 * Boundary: types only; the tasks and their state are the app's.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (owner request 2026-10-29).
 */
import type { TaskTrayTask } from "#contracts/types/task-tray-task.type";

/** Props shared by the web and native `TaskTray`. */
export interface TaskTrayContractProps {
  /** The tasks, newest first. The tray draws nothing while this is empty. */
  readonly tasks: readonly TaskTrayTask[];
  /** The tray's name; defaults to the catalogue's "Background tasks". */
  readonly label?: string | undefined;
  /** Called with a queued or running task's id when its cancel button is pressed; no cancel button without it. */
  readonly onCancel?: ((id: string) => void) | undefined;
  /** Called with a failed task's id when its retry button is pressed; no retry button without it. */
  readonly onRetry?: ((id: string) => void) | undefined;
  /** Called with a finished task's id (done, failed or canceled) when its remove button is pressed. */
  readonly onDismiss?: ((id: string) => void) | undefined;
  /** Called when "Clear finished" is pressed; the button shows while a task has finished. */
  readonly onClear?: (() => void) | undefined;
  /** True to fold the list to the header, for a controlled tray; pair it with `onCollapsedChange`. */
  readonly isCollapsed?: boolean | undefined;
  /** Folded at the start, for an uncontrolled tray. Defaults to false. */
  readonly defaultCollapsed?: boolean | undefined;
  /** Called with the new folded state when the header's toggle is pressed. */
  readonly onCollapsedChange?: ((isCollapsed: boolean) => void) | undefined;
  /** `docked` (the default) pins it to the bottom end corner of the screen; `inline` leaves it in the flow. */
  readonly placement?: "docked" | "inline" | undefined;
}
