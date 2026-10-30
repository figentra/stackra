/**
 * Stackra file contract:
 * Purpose: proves `bytesUnitOf` picks the largest unit at or above one, by 1000 or by 1024.
 * Boundary: pure function.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { bytesUnitOf } from "#core/functions/bytes-unit-of.function";

describe("bytesUnitOf", () => {
  it("steps by 1000 or 1024", () => {
    expect(bytesUnitOf(512)).toEqual({ value: 512, unit: "byte" });
    expect(bytesUnitOf(1_500_000)).toEqual({ value: 1.5, unit: "megabyte" });
    expect(bytesUnitOf(1024 ** 3, "binary")).toEqual({ value: 1, unit: "gigabyte" });
  });
});
