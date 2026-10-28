/**
 * Stackra file contract:
 * Purpose: `MemorySystemSettingsDriver`, the `SystemSettings` driver of tests and of targets with none of these
 *          controls (the web, the desktop): the `memory` candidate; a test sets each value.
 * Boundary: no tracking control and no background refresh switch (`null`), power and data saving off, and opening the
 *           settings only counts the call. The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers); ADR 0250 (2026-10-29 note).
 */
import { Driver } from "@stackra/container";

import { SystemSettings } from "#contracts/ports/system-settings.port";
import type { PermissionStatus } from "#contracts/types/permission-status.type";
import { liveValue } from "#core/functions/live-value.function";
import type { LiveValue } from "#core/types/live-value.type";

/**
 * System settings in memory.
 *
 * @example
 * const settings = new MemorySystemSettingsDriver();
 * settings.trackingStatus = "denied";
 * settings.lowPowerMode.set(true);
 */
export class MemorySystemSettingsDriver extends Driver(SystemSettings) {
  /** Low Power Mode; a test sets it. */
  readonly lowPowerMode: LiveValue<boolean> = liveValue(false);

  /** An expensive connection; a test sets it. */
  readonly expensiveNetwork: LiveValue<boolean> = liveValue(false);

  /** What `tracking` answers; `requestTracking` turns `prompt` into `requestAnswer`. */
  trackingStatus: PermissionStatus | null = null;

  /** What the tracking prompt answers. */
  requestAnswer: PermissionStatus = "denied";

  /** What `backgroundRefresh` answers. */
  backgroundRefreshStatus: PermissionStatus | null = null;

  /** How many times the settings page was opened. */
  settingsOpened = 0;

  /** Where tracking stands. */
  async tracking(): Promise<PermissionStatus | null> {
    return this.trackingStatus;
  }

  /** Answers a `prompt` with `requestAnswer`; a decided or missing control stays as it is. */
  async requestTracking(): Promise<PermissionStatus | null> {
    if (this.trackingStatus === "prompt") this.trackingStatus = this.requestAnswer;
    return this.trackingStatus;
  }

  /** Whether background refresh is allowed. */
  async backgroundRefresh(): Promise<PermissionStatus | null> {
    return this.backgroundRefreshStatus;
  }

  /** Counts the call. */
  async openSettings(): Promise<void> {
    this.settingsOpened += 1;
  }
}
