/**
 * Stackra file contract:
 * Purpose: `MemoryKioskModeDriver`, the `KioskMode` driver of tests and of targets with no kiosk support: the `memory`
 *          candidate; it records the mode and touches no window.
 * Boundary: a test sets `isSupported = false` to see every call refuse with `unavailable` on `window`. The constructor
 *           takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers); ADR 0281 (kiosk launch mode).
 */
import { Driver } from "@stackra/container";

import { KioskMode } from "#contracts/ports/kiosk-mode.port";
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import { PlatformCapability } from "#core/enums/platform-capability.enum";
import { refuse } from "#core/functions/refuse.function";

/**
 * Kiosk mode in memory.
 *
 * @example
 * const kiosk = new MemoryKioskModeDriver();
 * await kiosk.enter();
 * await kiosk.isActive(); // true
 */
export class MemoryKioskModeDriver extends Driver(KioskMode) {
  /** Whether the target can enter kiosk mode. */
  isSupported = true;

  /** Whether kiosk mode is on. */
  active = false;

  /** Answers while supported. */
  async probe(): Promise<CapabilityResult> {
    if (!this.isSupported) return refuse(PlatformCapability.Window, "unavailable");
    return { ok: true, data: undefined };
  }

  /** Turns kiosk mode on. */
  async enter(): Promise<CapabilityResult> {
    if (!this.isSupported) return refuse(PlatformCapability.Window, "unavailable");
    this.active = true;
    return { ok: true, data: undefined };
  }

  /** Turns kiosk mode off. */
  async exit(): Promise<CapabilityResult> {
    if (!this.isSupported) return refuse(PlatformCapability.Window, "unavailable");
    this.active = false;
    return { ok: true, data: undefined };
  }

  /** Whether kiosk mode is on. */
  async isActive(): Promise<boolean> {
    return this.active;
  }
}
