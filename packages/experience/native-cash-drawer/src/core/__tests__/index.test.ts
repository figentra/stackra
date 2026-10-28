/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the `printer_kick`, Sunmi and PAX drivers the generated native
 *          wiring imports, and nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias with no Expo modules registry present,
 *           so an eager native lookup would break the test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0478 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import * as entry from "#core/index";

describe("@stackra/native-cash-drawer", () => {
  it("exports the three drivers", () => {
    expect(Object.keys(entry).sort()).toEqual([
      "PaxCashDrawerDriver",
      "PrinterKickCashDrawerDriver",
      "SunmiCashDrawerDriver",
    ]);
  });
});
