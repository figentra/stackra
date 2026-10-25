/**
 * Stackra file contract:
 * Purpose: `PERIPHERAL_DRIVERS`, the driver names of the three selectable ports, each a driver file prefix of this
 *          package: `memory` (`.`) for each, `escpos`, `printer_kick` and `hid` (`./electron`).
 * Boundary: internal data; it types `PeripheralsConfig`'s driver fields through the `DriverRegistry` entries and checks
 *           them in the shipped schema. The names must equal the ones gen writes for these ports in a host's wiring,
 *           because both augment the same `DriverRegistry` keys. A new driver file adds its name here.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9).
 */

/** The driver names of `ReceiptPrinter`, `CashDrawer` and `BarcodeScanner`. */
export const PERIPHERAL_DRIVERS = Object.freeze({
  printer: ["memory", "escpos"],
  drawer: ["memory", "printer_kick"],
  scanner: ["memory", "hid"],
} as const);
