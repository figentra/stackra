/**
 * Stackra file contract:
 * Purpose: type tests of `Json`: nested JSON values are accepted and survive a JSON round trip; `undefined`,
 *          functions and `Date` are refused.
 * Boundary: test only; the assertions are compile-time (`@ts-expect-error`) plus runtime checks of the same values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, expect, it } from "@stackra/testing";

import type { Json } from "#core/types/json.type";

describe("Json", () => {
  it("takes nested JSON values that survive a round trip", () => {
    const body: Json = {
      type: "doc",
      content: [{ text: "Linen shirt", marks: null, size: 2, isBold: true }],
    };
    const extensions: Record<string, Json> = { loyalty: { points: 120 } };
    // oxlint-disable-next-line unicorn/prefer-structured-clone -- a JSON round trip on purpose: it is what the wire does (Dates become strings, undefined and functions drop)
    expect(JSON.parse(JSON.stringify(body))).toEqual(body);
    // oxlint-disable-next-line unicorn/prefer-structured-clone -- a JSON round trip on purpose: it is what the wire does (Dates become strings, undefined and functions drop)
    expect(JSON.parse(JSON.stringify(extensions))).toEqual(extensions);
  });

  it("refuses values JSON cannot carry", () => {
    // @ts-expect-error -- undefined is not JSON
    const missing: Json = undefined;
    // @ts-expect-error -- a Date is not JSON; a date field has its own codec
    const when: Json = new Date(0);
    // @ts-expect-error -- a function is not JSON
    const code: Json = Math.max;
    expect([missing, when, typeof code]).toEqual([undefined, new Date(0), "function"]);
  });
});
