/**
 * Stackra file contract:
 * Purpose: unit tests of `otlpValue`: each JSON type, dates, nested objects and arrays, the empty value for null and
 *          undefined, and the depth cut that stops a cycle.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0184 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { otlpValue } from "#core/functions/otlp-value.function";

describe("otlpValue", () => {
  it("encodes scalars", () => {
    expect(otlpValue("a")).toEqual({ stringValue: "a" });
    expect(otlpValue(true)).toEqual({ boolValue: true });
    expect(otlpValue(3)).toEqual({ intValue: "3" });
    expect(otlpValue(1.5)).toEqual({ doubleValue: 1.5 });
    expect(otlpValue(10n)).toEqual({ intValue: "10" });
    expect(otlpValue(new Date("2026-10-25T00:00:00.000Z"))).toEqual({
      stringValue: "2026-10-25T00:00:00.000Z",
    });
    expect(otlpValue(null)).toEqual({});
    expect(otlpValue(undefined)).toEqual({});
  });

  it("encodes arrays and objects", () => {
    expect(otlpValue({ lines: [1, "x"] })).toEqual({
      kvlistValue: {
        values: [
          {
            key: "lines",
            value: { arrayValue: { values: [{ intValue: "1" }, { stringValue: "x" }] } },
          },
        ],
      },
    });
  });

  it("cuts a cycle at the depth limit", () => {
    const cycle: Record<string, unknown> = {};
    cycle["self"] = cycle;
    expect(JSON.stringify(otlpValue(cycle))).toContain("[depth]");
  });
});
