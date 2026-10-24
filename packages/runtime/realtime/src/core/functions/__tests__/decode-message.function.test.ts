/**
 * Stackra file contract:
 * Purpose: unit tests of `decodeMessage`: a well-formed frame decodes to exactly its three fields, and anything else
 *          (not JSON, not an object, a missing or non-string field) is dropped as `undefined`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0225.
 */
import { describe, expect, it } from "@stackra/testing";

import { decodeMessage } from "#core/functions/decode-message.function";

const MESSAGE = { channel: "tenant.ten_1.orders", name: "orders.order.paid.v1", id: "evt_1" };

describe("decodeMessage", () => {
  it("decodes a frame to its three fields only", () => {
    expect(decodeMessage(JSON.stringify(MESSAGE))).toEqual(MESSAGE);
    expect(decodeMessage(JSON.stringify({ ...MESSAGE, data: { totalMinor: 100 } }))).toEqual(
      MESSAGE,
    );
  });

  it("drops anything that is not a message", () => {
    for (const text of [
      "not json",
      "null",
      "42",
      '"text"',
      JSON.stringify({ ...MESSAGE, id: 1 }),
      JSON.stringify({ channel: MESSAGE.channel, name: MESSAGE.name }),
    ])
      expect(decodeMessage(text)).toBeUndefined();
  });
});
