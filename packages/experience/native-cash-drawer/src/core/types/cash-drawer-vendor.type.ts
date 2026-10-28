/**
 * Stackra file contract:
 * Purpose: `CashDrawerVendor`, one terminal family whose built-in drawer port the module drives: its driver name and
 *          the SDK status codes of the printer that drives the drawer that mean ready.
 * Boundary: a type only; the families are `CASH_DRAWER_VENDORS`. A drawer on an Epson or Star printer is not a family
 *           here: it opens through the printer (`printer_kick`). Which families a build links is the runway's
 *           `device:<family>` list, applied by the config plugin (ADR 0442 decision 3).
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 2 and 5); ADR 0458 (decision 3); ADR 0459 (decision 3).
 */

/** A terminal family with a built-in drawer port. */
export interface CashDrawerVendor {
  /** The driver name in `peripherals.drawer`, and the vendor name the module takes. */
  readonly name: "sunmi" | "pax";
  /** The vendor SDK printer status codes that mean ready; the drawer is driven by that printer. */
  readonly printerReady: readonly number[];
}
