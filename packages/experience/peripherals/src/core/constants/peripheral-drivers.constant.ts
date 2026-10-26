/**
 * Stackra file contract:
 * Purpose: `PERIPHERAL_DRIVERS`, the driver names of the six selectable ports, each a driver file prefix of this
 *          package: `memory` (`.`) for each, `channel` (`.`), and `escpos`, `printer_kick`, `hid` and `zpl`
 *          (`./desktop`). A card terminal provider's driver joins `cardTerminal` with its own ADR.
 * Boundary: internal data; it types `PeripheralsConfig`'s driver fields through the `DriverRegistry` entries and checks
 *           them in the shipped schema. The names must equal the ones gen writes for these ports in a host's wiring,
 *           because both augment the same `DriverRegistry` keys. A new driver file adds its name here.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9).
 */

/** The driver names of each selectable port, keyed by its `PeripheralsConfig` field. */
export const PERIPHERAL_DRIVERS = Object.freeze({
  printer: ["memory", "escpos"],
  drawer: ["memory", "printer_kick"],
  scanner: ["memory", "hid"],
  labelPrinter: ["memory", "zpl"],
  customerDisplay: ["memory", "channel", "external"],
  cardTerminal: ["memory"],
  accessController: ["memory"],
} as const);
