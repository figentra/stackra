/**
 * Stackra file contract:
 * Purpose: unit tests of `readPath`: nested objects and array indexes, `undefined` for a missing step, never a prototype.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { describe, expect, it } from "@stackra/testing";

import { readPath } from "#core/functions/read-path.function";

describe("readPath", () => {
  it("walks objects and arrays", () => {
    const data = { order: { lines: [{ name: "Tea" }] } };
    expect(readPath(data, "order.lines.0.name")).toBe("Tea");
    expect(readPath(data, "order.total")).toBeUndefined();
    expect(readPath(null, "a")).toBeUndefined();
  });

  it("never reaches a prototype", () => {
    expect(readPath({}, "constructor")).toBeUndefined();
    expect(readPath({ a: {} }, "a.__proto__")).toBeUndefined();
  });
});
