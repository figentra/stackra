/**
 * Stackra file contract:
 * Purpose: unit tests of `canonicalJson`: keys sorted at every depth, undefined members dropped, array order and nulls
 *          kept, dates as ISO 8601, and the same text for the same value whatever its key order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0212 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { canonicalJson } from "#core/functions/canonical-json.function";

describe("canonicalJson", () => {
  it("sorts keys at every depth and keeps array order", () => {
    expect(canonicalJson({ b: 1, a: { d: [3, 1], c: null } })).toBe(
      '{"a":{"c":null,"d":[3,1]},"b":1}',
    );
  });

  it("writes the same text whatever the key order", () => {
    expect(canonicalJson({ x: 1, y: { q: 2, p: 3 } })).toBe(
      canonicalJson({ y: { p: 3, q: 2 }, x: 1 }),
    );
  });

  it("drops undefined members, writes undefined items and non-finite numbers as null", () => {
    expect(canonicalJson({ a: undefined, b: [undefined, Number.NaN] })).toBe('{"b":[null,null]}');
    expect(canonicalJson(undefined)).toBe("null");
  });

  it("writes dates as ISO 8601 UTC", () => {
    expect(canonicalJson({ at: new Date(Date.UTC(2026, 9, 26, 8)) })).toBe(
      '{"at":"2026-10-26T08:00:00.000Z"}',
    );
  });
});

describe("canonicalJson key order", () => {
  it("sorts integer-like keys as text, not in the engine's numeric order", () => {
    expect(canonicalJson({ 2: "b", 10: "a", x: 0 })).toBe('{"10":"a","2":"b","x":0}');
  });
});
