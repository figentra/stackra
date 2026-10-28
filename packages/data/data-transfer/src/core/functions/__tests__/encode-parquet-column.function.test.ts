/**
 * Stackra file contract:
 * Purpose: unit tests of `encodeParquetColumn`: the page ends with run-length definition levels and the plain values of
 *          each kind (text, double, boolean, timestamp), and a cell that does not fit its kind is refused.
 * Boundary: test only; checks the page bytes after the header.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0163 and ADR 0190 (2026-10-29 amendments); Apache Parquet format.
 */
import { describe, expect, it } from "@stackra/testing";

import { encodeParquetColumn } from "#core/functions/encode-parquet-column.function";

/** The last `n` bytes of `bytes`. */
function tail(bytes: Uint8Array, n: number): number[] {
  return [...bytes.subarray(bytes.length - n)];
}

describe(encodeParquetColumn, () => {
  it("writes text with definition levels for nulls", () => {
    const bytes = encodeParquetColumn("utf8", ["a", null]);
    expect(tail(bytes, 13)).toEqual([4, 0, 0, 0, 2, 1, 2, 0, 1, 0, 0, 0, 0x61]);
    expect(bytes[0]).toBe(0x15);
  });

  it("writes doubles, booleans and timestamps in plain encoding", () => {
    expect(tail(encodeParquetColumn("double", [1]), 8)).toEqual([0, 0, 0, 0, 0, 0, 0xf0, 0x3f]);
    expect(tail(encodeParquetColumn("boolean", [true, false, true]), 1)).toEqual([0b101]);
    expect(tail(encodeParquetColumn("timestamp", [new Date(256)]), 8)).toEqual([
      0, 1, 0, 0, 0, 0, 0, 0,
    ]);
  });

  it("refuses a cell that does not fit the kind", () => {
    expect(() => encodeParquetColumn("double", ["x"])).toThrow(TypeError);
    expect(() => encodeParquetColumn("boolean", [1])).toThrow(TypeError);
  });
});
