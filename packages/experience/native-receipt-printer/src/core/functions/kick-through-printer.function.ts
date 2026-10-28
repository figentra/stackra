/**
 * Stackra file contract:
 * Purpose: `kickThroughPrinter`, the drawer kick through a bound `ReceiptPrinter`: it probes the printer first and
 *          pulses the pin only when the printer is ready (ADR 0458 decision 3), so a drawer never opens on a printer
 *          that cannot print the receipt.
 * Boundary: public, for @stackra/native-cash-drawer's `printer_kick` driver; it works with any `ReceiptPrinter`
 *           driver, this package's or `memory`. It refuses exactly as the printer does. A kick is one-way.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5); ADR 0458 (decision 3); ADR 0253 (decision 4).
 */
import type { DrawerPin, ReceiptPrinter } from "@stackra/peripherals/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

/**
 * Probes `printer`, then pulses `pin` through it.
 *
 * @example
 * const opened = await kickThroughPrinter(printer, config.drawerPin);
 * if (!opened.ok) toast.warning(t(I18n.console.capabilities[opened.error.code]));
 */
export async function kickThroughPrinter(
  printer: ReceiptPrinter,
  pin: DrawerPin,
): Promise<CapabilityResult> {
  const ready = await printer.probe();
  if (!ready.ok) return ready;
  return printer.kickDrawer(pin);
}
