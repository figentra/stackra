/**
 * Stackra file contract:
 * Purpose: `MemorySystemPermissionsDriver`, the `SystemPermissions` driver of tests and of targets that ask for none
 *          of these permissions themselves (the web, the desktop): the `memory` candidate; a test sets each status.
 * Boundary: every permission starts `prompt`; `request` turns a `prompt` or `denied` into `requestAnswer`, a granted
 *           or blocked one stays; opening the settings only counts the call. The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers); ADR 0250 (2026-10-29 note).
 */
import { Driver } from "@stackra/container";

import { SystemPermissions } from "#contracts/ports/system-permissions.port";
import type { DevicePermission } from "#contracts/types/device-permission.type";
import type { DevicePermissionStatus } from "#contracts/types/device-permission-status.type";

/**
 * Device permissions in memory.
 *
 * @example
 * const permissions = new MemorySystemPermissionsDriver();
 * permissions.statuses.camera = "blocked";
 * permissions.requestAnswer = "granted";
 */
export class MemorySystemPermissionsDriver extends Driver(SystemPermissions) {
  /** Where each permission stands; a test sets it. */
  readonly statuses: Record<DevicePermission, DevicePermissionStatus> = {
    camera: "prompt",
    location: "prompt",
    photos: "prompt",
    bluetooth: "prompt",
    microphone: "prompt",
  };

  /** What the prompt answers. */
  requestAnswer: Exclude<DevicePermissionStatus, "prompt"> = "granted";

  /** How many times the settings page was opened. */
  settingsOpened = 0;

  /** Where `permission` stands. */
  async status(permission: DevicePermission): Promise<DevicePermissionStatus> {
    return this.statuses[permission];
  }

  /** Answers an askable permission with `requestAnswer`; a granted or blocked one stays as it is. */
  async request(permission: DevicePermission): Promise<Exclude<DevicePermissionStatus, "prompt">> {
    const current = this.statuses[permission];
    if (current === "granted" || current === "blocked") return current;
    this.statuses[permission] = this.requestAnswer;
    return this.requestAnswer;
  }

  /** Counts the call. */
  async openSettings(): Promise<void> {
    this.settingsOpened += 1;
  }
}
