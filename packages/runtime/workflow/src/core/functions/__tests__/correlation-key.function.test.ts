/**
 * Stackra file contract:
 * Purpose: unit tests of `correlationKey`: text stays as it is, nothing is `""`, and objects compare equal whatever
 *          their key order, nested objects and arrays included.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0152 (0294 note: correlation).
 */
import { describe, expect, it } from "@stackra/testing";

import { correlationKey } from "#core/functions/correlation-key.function";

describe(correlationKey, () => {
  it("keeps text and turns nothing into the empty key", () => {
    expect(correlationKey("ord_1")).toBe("ord_1");
    expect(correlationKey(undefined)).toBe("");
    expect(correlationKey(null)).toBe("");
  });

  it("sorts object keys, recursively, so key order never matters", () => {
    expect(correlationKey({ reference: "ord_1", memberId: "mem_1" })).toBe(
      correlationKey({ memberId: "mem_1", reference: "ord_1" }),
    );
    expect(correlationKey({ b: [{ y: 1, x: 2 }], a: 1 })).toBe('{"a":1,"b":[{"x":2,"y":1}]}');
  });

  it("tells different values apart", () => {
    expect(correlationKey({ memberId: "mem_1" })).not.toBe(correlationKey({ memberId: "mem_2" }));
  });
});
