/**
 * Stackra file contract:
 * Purpose: `TaskTrayTask`, one background task in a TaskTray: an upload, an export, an import or any long job, with
 *          its state, how far along it is and a line of detail.
 * Boundary: types only; the app owns the tasks and their state.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (owner request 2026-10-29).
 */
import type { IconSlot } from "#contracts/types/icon-slot.type";

/** One background task. */
export interface TaskTrayTask {
  /** Unique within the tray; handed back to `onCancel`, `onRetry` and `onDismiss`. */
  readonly id: string;
  /** What it is, for example "Export orders.csv"; shown as given. */
  readonly label: string;
  /** Its state: `queued`, `running`, `done`, `error` or `canceled`. */
  readonly status: "queued" | "running" | "done" | "error" | "canceled";
  /** How far a running task is, 0 to 100; left out, its bar is indeterminate. */
  readonly progress?: number | undefined;
  /** A line under the name, for example "120 of 400 rows" or why it failed; the state's word when left out. */
  readonly detail?: string | undefined;
  /** An icon before the name, for example `upload`, `download` or `file-spreadsheet`. */
  readonly icon?: IconSlot | undefined;
}
