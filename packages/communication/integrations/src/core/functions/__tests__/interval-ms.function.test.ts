/**
 * Stackra file contract:
 * Purpose: unit tests of `intervalMs`: each unit converts, decimals round to whole milliseconds, and a malformed or
 *          negative interval throws a `RangeError`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rule 13).
 */
import { describe, expect, it } from "@stackra/testing";

import { intervalMs } from "#core/functions/interval-ms.function";
import type { Interval } from "#core/types/interval.type";

describe("intervalMs", () => {
  it("reads every unit", () => {
    expect(intervalMs("200ms")).toBe(200);
    expect(intervalMs("1s")).toBe(1000);
    expect(intervalMs("5m")).toBe(300_000);
    expect(intervalMs("6h")).toBe(21_600_000);
    expect(intervalMs("1d")).toBe(86_400_000);
    expect(intervalMs("1.5s")).toBe(1500);
  });

  it("refuses a malformed or negative interval", () => {
    expect(() => intervalMs("-1s")).toThrow(RangeError);
    expect(() => intervalMs("1w" as Interval)).toThrow(RangeError);
    expect(() => intervalMs("s" as Interval)).toThrow(RangeError);
  });
});
