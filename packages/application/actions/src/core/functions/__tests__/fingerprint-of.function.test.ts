/**
 * Stackra file contract:
 * Purpose: unit tests of `fingerprintOf`: a 64-character hex SHA-256, equal for inputs that differ only in key order,
 *          different when a value, the array order or the call identity differs, dates hashed as ISO strings, and a
 *          `bigint` refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0136 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { fingerprintOf } from "#core/functions/fingerprint-of.function";

describe(fingerprintOf, () => {
  it("hashes to hex, ignoring key order", async () => {
    const left = await fingerprintOf("orders.order.create@1", {
      lines: [{ quantity: 1, variantId: "var_1" }],
      note: "x",
    });
    const right = await fingerprintOf("orders.order.create@1", {
      note: "x",
      lines: [{ variantId: "var_1", quantity: 1 }],
    });
    expect(left).toMatch(/^[0-9a-f]{64}$/);
    expect(right).toBe(left);
  });

  it("changes with a value, the array order or the identity", async () => {
    const base = await fingerprintOf("orders.order.create@1", { ids: [1, 2] });
    expect(await fingerprintOf("orders.order.create@1", { ids: [2, 1] })).not.toBe(base);
    expect(await fingerprintOf("orders.order.create@1", { ids: [1, 3] })).not.toBe(base);
    expect(await fingerprintOf("orders.order.cancel@1", { ids: [1, 2] })).not.toBe(base);
  });

  it("hashes a date as its ISO string and refuses a bigint", async () => {
    const at = new Date("2026-10-24T10:00:00.000Z");
    expect(await fingerprintOf({ at })).toBe(
      await fingerprintOf({ at: "2026-10-24T10:00:00.000Z" }),
    );
    await expect(fingerprintOf({ amount: 1n })).rejects.toThrow(TypeError);
  });
});
