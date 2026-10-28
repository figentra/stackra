/**
 * Stackra file contract:
 * Purpose: `MemorySecondScreenDriver`, the `SecondScreen` driver of tests and of targets with no second display: the
 *          `memory` candidate; it records the open route and touches no window.
 * Boundary: a test sets `hasDisplay = false` to see `probe` and `open` refuse with `unavailable` on `window`. A route
 *           that is not a path is a `TypeError`, as on every driver. The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers); ADR 0339 (open question 3).
 */
import { Driver } from "@stackra/container";

import { SecondScreen } from "#contracts/ports/second-screen.port";
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import { PlatformCapability } from "#core/enums/platform-capability.enum";
import { refuse } from "#core/functions/refuse.function";

/**
 * A second screen in memory.
 *
 * @example
 * const screen = new MemorySecondScreenDriver();
 * await screen.open("/customer-display");
 * screen.route; // "/customer-display"
 */
export class MemorySecondScreenDriver extends Driver(SecondScreen) {
  /** Whether a second display is connected. */
  hasDisplay = true;

  /** The route open on it; null when closed. */
  route: string | null = null;

  /** Answers while a display is connected. */
  async probe(): Promise<CapabilityResult> {
    if (!this.hasDisplay) return refuse(PlatformCapability.Window, "unavailable");
    return { ok: true, data: undefined };
  }

  /**
   * Opens `route` on the display.
   *
   * @throws TypeError when `route` is not a path starting with a single `/`.
   */
  async open(route: string): Promise<CapabilityResult> {
    if (!route.startsWith("/") || route.startsWith("//"))
      throw new TypeError(`SecondScreen.open needs a path of the app, got "${route}"`);
    if (!this.hasDisplay) return refuse(PlatformCapability.Window, "unavailable");
    this.route = route;
    return { ok: true, data: undefined };
  }

  /** Closes the window. */
  async close(): Promise<CapabilityResult> {
    this.route = null;
    return { ok: true, data: undefined };
  }
}
