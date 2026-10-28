/**
 * Stackra file contract:
 * Purpose: unit tests of `PERIPHERAL_DRIVERS`: each selectable port lists `memory` first and exactly the driver names
 *          of this package and of the native module packages that implement its ports (ADR 0478 decision 5), the names
 *          the generated wiring declares for the same ports.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9); STA-965;
 *                     ADR 0442; ADR 0478 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { PERIPHERAL_DRIVERS } from "#core/constants/peripheral-drivers.constant";

describe("PERIPHERAL_DRIVERS", () => {
  it("names the shipped drivers of each port", () => {
    expect(PERIPHERAL_DRIVERS).toEqual({
      printer: ["memory", "escpos", "epson", "star", "sunmi", "pax", "imin"],
      drawer: ["memory", "printer_kick", "sunmi", "pax", "imin"],
      scanner: ["memory", "hid", "sunmi", "pax", "imin"],
      labelPrinter: ["memory", "zpl"],
      customerDisplay: ["memory", "channel", "external"],
      cardTerminal: ["memory", "ecr", "stripe_terminal"],
      accessController: ["memory"],
      kitchenPrinter: ["memory", "escpos"],
      bumpBar: ["memory", "hid"],
      usedReceiptStore: ["memory"],
      scannerScale: ["memory"],
      baggingScale: ["memory"],
      labelScale: ["memory"],
      driveThroughLane: ["memory"],
    });
    expect(Object.isFrozen(PERIPHERAL_DRIVERS)).toBe(true);
  });
});
