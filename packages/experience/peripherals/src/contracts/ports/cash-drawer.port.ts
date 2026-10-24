/**
 * Stackra file contract:
 * Purpose: the `CashDrawer` port: the POS kit's cash drawer (ADR 0253). It opens the drawer and answers a probe, each
 *          as a `CapabilityResult` that refuses with capability `print` when the drawer cannot be reached, because a
 *          drawer opens through the receipt printer it is wired to. Config `peripherals.drawer` picks the driver
 *          (`printer_kick`, `memory`).
 * Boundary: an abstract class that is its own token, keyed `peripherals.CashDrawer`. A drawer reports no open or
 *           closed state here: an ESC/POS drawer kick is one-way.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decisions 1 and 4); ADR 0250 (decision 3); ADR 0294 (decisions 4, 15 and 16).
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

/**
 * The cash drawer.
 *
 * @example
 * const opened = await drawer.open();
 * if (!opened.ok) toast.warning(t(I18n.console.capabilities[opened.error.code]));
 */
export abstract class CashDrawer extends Port {
  /** Type-only port key, so `DriverName<CashDrawer>` narrows to this port's drivers. */
  declare readonly "~key": "peripherals.CashDrawer";

  /** Whether the drawer can be reached now. */
  abstract probe(): Promise<CapabilityResult>;

  /** Opens the drawer. */
  abstract open(): Promise<CapabilityResult>;
}
