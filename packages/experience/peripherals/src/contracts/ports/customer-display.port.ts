/**
 * Stackra file contract:
 * Purpose: the `CustomerDisplay` port: the till's customer-facing display. It shows a view (basket, total, message)
 *          and clears it, each as a `CapabilityResult` that refuses with capability `window` when no display is there.
 *          Config `peripherals.customerDisplay` picks the driver (`channel`, `memory`).
 * Boundary: an abstract class that is its own token, keyed `peripherals.CustomerDisplay`. The display itself is a
 *           second window (Electron, a browser window on the second screen) or a device; the driver only delivers
 *           views to it.
 * Runtime: isomorphic
 * Governing contract: ADR 0339 (decision 1 and open question 3); ADR 0250 (decision 3); ADR 0294 (decisions 15 and 16).
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

import type { CustomerDisplayView } from "#contracts/types/customer-display-view.type";

/**
 * The customer-facing display.
 *
 * @example
 * await display.show({ lines: [{ label: "Latte", amount: "SAR 18.00" }], total: "SAR 18.00", message: null });
 */
export abstract class CustomerDisplay extends Port {
  /** Type-only port key, so `DriverName<CustomerDisplay>` narrows to this port's drivers. */
  declare readonly "~key": "peripherals.CustomerDisplay";

  /** Whether views can be delivered now. */
  abstract probe(): Promise<CapabilityResult>;

  /** Shows `view`, replacing the one before. */
  abstract show(view: CustomerDisplayView): Promise<CapabilityResult>;

  /** Clears the display (the idle screen). */
  abstract clear(): Promise<CapabilityResult>;
}
