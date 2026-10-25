/**
 * Stackra file contract:
 * Purpose: `MemoryCashDrawerDriver`, the `CashDrawer` driver that opens nothing real: the `memory` candidate
 *          (`peripherals.drawer: "memory"`), the driver of tests and of a till with no drawer.
 * Boundary: no device is touched. `opened` counts the opens; a test sets `isPresent = false` to see the refusal a
 *           missing drawer gives (capability `print`, as through a printer). The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decision 4); ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers).
 */
import { Driver } from "@stackra/container";
import { Capability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { CashDrawer } from "#contracts/ports/cash-drawer.port";
import { refuse } from "#core/functions/refuse.function";

/**
 * A cash drawer in memory.
 *
 * @example
 * const drawer = new MemoryCashDrawerDriver();
 * await drawer.open();
 * drawer.opened; // 1
 */
export class MemoryCashDrawerDriver extends Driver(CashDrawer) {
  /** Whether the drawer answers; false makes every call refuse with `unavailable`. */
  isPresent = true;

  /** How many times the drawer was opened. */
  opened = 0;

  /** Answers while present. */
  async probe(): Promise<CapabilityResult> {
    if (!this.isPresent) return refuse(Capability.Print, "unavailable");
    return { ok: true, data: undefined };
  }

  /** Counts the open. */
  async open(): Promise<CapabilityResult> {
    if (!this.isPresent) return refuse(Capability.Print, "unavailable");
    this.opened += 1;
    return { ok: true, data: undefined };
  }
}
