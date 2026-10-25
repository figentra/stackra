/**
 * Stackra file contract:
 * Purpose: unit tests of `PERIPHERAL_DRIVERS`: each selectable port lists `memory` first and exactly the driver files
 *          this package ships, the names the template's generated desktop wiring declares for the same ports.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9).
 */
import { describe, expect, it } from "@stackra/testing";

import { PERIPHERAL_DRIVERS } from "#core/constants/peripheral-drivers.constant";

describe("PERIPHERAL_DRIVERS", () => {
  it("names the shipped drivers of each port", () => {
    expect(PERIPHERAL_DRIVERS).toEqual({
      printer: ["memory", "escpos"],
      drawer: ["memory", "printer_kick"],
      scanner: ["memory", "hid"],
      labelPrinter: ["memory", "zpl"],
      customerDisplay: ["memory", "channel"],
      cardTerminal: ["memory"],
    });
    expect(Object.isFrozen(PERIPHERAL_DRIVERS)).toBe(true);
  });
});
