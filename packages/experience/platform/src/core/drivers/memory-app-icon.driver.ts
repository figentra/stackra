/**
 * Stackra file contract:
 * Purpose: `MemoryAppIconDriver`, the `AppIcon` driver of tests and of targets whose icon the app cannot change (the
 *          web, the desktop): the `memory` candidate; a test switches icons and reads the result.
 * Boundary: holds the current icon in memory and accepts any name; a test sets `isSupported = false` to see `set`
 *           refuse `unavailable` as a device without alternate icons does. The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers); ADR 0250 (decision 2).
 */
import { Driver } from "@stackra/container";

import { AppIcon } from "#contracts/ports/app-icon.port";
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import { PlatformCapability } from "#core/enums/platform-capability.enum";
import { liveValue } from "#core/functions/live-value.function";
import { refuse } from "#core/functions/refuse.function";

/**
 * The app icon in memory.
 *
 * @example
 * const appIcon = new MemoryAppIconDriver();
 * await appIcon.set("Ramadan");
 * appIcon.current.get(); // "Ramadan"
 */
export class MemoryAppIconDriver extends Driver(AppIcon) {
  /** The icon showing now; `null` is the default. */
  readonly current = liveValue<string | null>(null);

  /** Whether switching is allowed; a test turns it off. */
  isSupported = true;

  /** Shows `name`, or the default for `null`; refuses when unsupported. */
  async set(name: string | null): Promise<CapabilityResult> {
    if (!this.isSupported) return refuse(PlatformCapability.AppIcon, "unavailable");
    this.current.set(name);
    return { ok: true, data: undefined };
  }
}
