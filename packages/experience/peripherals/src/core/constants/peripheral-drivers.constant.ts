/**
 * Stackra file contract:
 * Purpose: `PERIPHERAL_DRIVERS`, the driver names of the selectable ports, each a driver file prefix of this
 *          package: `memory` (`.`) for each, `channel` and `external` (`.`), and `escpos`, `printer_kick`, `hid`, `zpl`
 *          and `ecr` (`./desktop`, the semi-integrated card terminal link of ADR 0377). A further card terminal link
 *          (serial, USB, Bluetooth) joins `cardTerminal` with its native transport; a shared
 *          used-receipt store joins `usedReceiptStore` with the venue that needs it; a scanner-scale, bagging-scale,
 *          label-scale or drive-through lane vendor's driver joins its field with its own ADR (STA-965).
 * Boundary: internal data; it types `PeripheralsConfig`'s driver fields through the `DriverRegistry` entries and checks
 *           them in the shipped schema. The names must equal the ones gen writes for these ports in a host's wiring,
 *           because both augment the same `DriverRegistry` keys. A new driver file adds its name here.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9); ADR 0449; STA-965; ADR 0377.
 */

/** The driver names of each selectable port, keyed by its `PeripheralsConfig` field. */
export const PERIPHERAL_DRIVERS = Object.freeze({
  printer: ["memory", "escpos"],
  drawer: ["memory", "printer_kick"],
  scanner: ["memory", "hid"],
  labelPrinter: ["memory", "zpl"],
  customerDisplay: ["memory", "channel", "external"],
  cardTerminal: ["memory", "ecr"],
  accessController: ["memory"],
  kitchenPrinter: ["memory", "escpos"],
  bumpBar: ["memory", "hid"],
  usedReceiptStore: ["memory"],
  scannerScale: ["memory"],
  baggingScale: ["memory"],
  labelScale: ["memory"],
  driveThroughLane: ["memory"],
} as const);
