/**
 * Stackra file contract:
 * Purpose: `DesktopApp`, what `createApp` from `@stackra/app/desktop` resolves to: `start()` and its open `windows`.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 8).
 */
import type { BrowserWindow } from "electron";

/** A desktop app's main process. */
export interface DesktopApp {
  /** Waits for Electron, applies the baseline, serves the bundle, answers bridges and opens the main window. */
  start: () => Promise<void>;

  /** The open windows, first opened first; a closed window leaves the list. */
  readonly windows: readonly BrowserWindow[];
}
