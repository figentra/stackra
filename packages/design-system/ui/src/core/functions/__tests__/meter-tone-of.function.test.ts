/**
 * Stackra file contract:
 * Purpose: proves `meterToneOf` follows the HTML meter rule for an optimum low, high and in the middle.
 * Boundary: pure function.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { meterToneOf } from "#core/functions/meter-tone-of.function";

describe("meterToneOf", () => {
  it("with a high optimum, low values are danger", () => {
    const bounds = { low: 30, high: 70, optimum: 90 };
    expect([10, 50, 80].map((value) => meterToneOf(value, bounds))).toEqual(["danger", "warning", "success"]);
  });

  it("with a low optimum, high values are danger", () => {
    const bounds = { low: 60, high: 85, optimum: 0 };
    expect([40, 70, 95].map((value) => meterToneOf(value, bounds))).toEqual(["success", "warning", "danger"]);
  });

  it("with a middle optimum, both ends are warnings", () => {
    const bounds = { low: 20, high: 80 };
    expect([10, 50, 90].map((value) => meterToneOf(value, bounds))).toEqual(["warning", "success", "warning"]);
  });
});
