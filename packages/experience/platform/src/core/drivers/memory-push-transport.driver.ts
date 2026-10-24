/**
 * Stackra file contract:
 * Purpose: `MemoryPushTransportDriver`, the `PushTransport` driver that registers nothing real: the `memory` candidate
 *          (`platform.push.provider: "memory"`), the driver of tests, of a dev build without push credentials and of
 *          the testing module.
 * Boundary: no device is touched. The permission starts at `prompt`, a request grants it unless a test set `denied`,
 *           and a registration yields the fixed token `memory` once granted. `settingsOpened` counts `openSettings`
 *           calls so a test can assert on the settings switch.
 * Runtime: isomorphic
 * Governing contract: ADR 0255 (decision 3); ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers).
 */
import { Driver } from "@stackra/container";

import { PushTransport } from "#contracts/ports/push-transport.port";
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import type { PermissionStatus } from "#contracts/types/permission-status.type";
import type { PushRegistration } from "#contracts/types/push-registration.type";
import { Capability } from "#core/enums/capability.enum";
import { refuse } from "#core/functions/refuse.function";

/**
 * Push in memory.
 *
 * @example
 * const push = new MemoryPushTransportDriver();
 * push.status = "denied";
 * await push.register(); // { ok: false, error: { code: "permission_denied", capability: "push" } }
 */
export class MemoryPushTransportDriver extends Driver(PushTransport) {
  /** Where the permission stands; a test sets it directly. */
  status: PermissionStatus = "prompt";

  /** How many times the OS settings were opened. */
  settingsOpened = 0;

  /** The current permission. */
  async permission(): Promise<PermissionStatus> {
    return this.status;
  }

  /** Grants a permission still to be asked; a denied one stays denied. */
  async requestPermission(): Promise<PermissionStatus> {
    if (this.status === "prompt") this.status = "granted";
    return this.status;
  }

  /** Counts the call. */
  async openSettings(): Promise<void> {
    this.settingsOpened += 1;
  }

  /** The fixed `memory` token once granted. */
  async register(): Promise<CapabilityResult<PushRegistration>> {
    if (this.status !== "granted") return refuse(Capability.Push, "permission_denied");
    return { ok: true, data: { provider: "memory", token: "memory" } };
  }
}
