/**
 * Stackra file contract:
 * Purpose: `MemoryCustomerDisplayDriver`, the `CustomerDisplay` driver that shows into memory: the `memory` candidate
 *          (`peripherals.customerDisplay: "memory"`), the driver of tests and of a till with no customer display.
 * Boundary: no window is touched. `current` is what the display shows now (`null` when cleared) and `shown` every view
 *           in order; a test sets `isPresent = false` to see the refusal. The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0339 (decision 1); ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers).
 */
import { Driver } from "@stackra/container";
import { Capability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { CustomerDisplay } from "#contracts/ports/customer-display.port";
import type { CustomerDisplayView } from "#contracts/types/customer-display-view.type";
import { refuse } from "#core/functions/refuse.function";

/**
 * A customer display in memory.
 *
 * @example
 * const display = new MemoryCustomerDisplayDriver();
 * await display.show({ lines: [], total: "SAR 0.00", message: "Welcome" });
 * display.current?.message; // "Welcome"
 */
export class MemoryCustomerDisplayDriver extends Driver(CustomerDisplay) {
  /** Every view shown, in order. */
  readonly shown: CustomerDisplayView[] = [];

  /** Whether a display is there; false makes every call refuse with `unavailable`. */
  isPresent = true;

  /** What the display shows now; null when cleared. */
  current: CustomerDisplayView | null = null;

  /** Answers while present. */
  async probe(): Promise<CapabilityResult> {
    if (!this.isPresent) return refuse(Capability.Window, "unavailable");
    return { ok: true, data: undefined };
  }

  /** Shows `view` and records it. */
  async show(view: CustomerDisplayView): Promise<CapabilityResult> {
    if (!this.isPresent) return refuse(Capability.Window, "unavailable");
    this.current = view;
    this.shown.push(view);
    return { ok: true, data: undefined };
  }

  /** Clears the display. */
  async clear(): Promise<CapabilityResult> {
    if (!this.isPresent) return refuse(Capability.Window, "unavailable");
    this.current = null;
    return { ok: true, data: undefined };
  }
}
