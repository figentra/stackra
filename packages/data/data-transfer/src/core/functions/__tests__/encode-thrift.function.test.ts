/**
 * Stackra file contract:
 * Purpose: unit tests of `encodeThrift`: the compact-protocol bytes of i32, i64, binary, short and long lists, nested
 *          structs, field-id deltas above 15, skipped undefined fields, and the refusal of field ids that do not ascend.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0163 and ADR 0190 (2026-10-29 amendments).
 */
import { describe, expect, it } from "@stackra/testing";

import { encodeThrift } from "#core/functions/encode-thrift.function";

describe(encodeThrift, () => {
  it("writes scalar fields with short headers and zigzag varints", () => {
    expect([...encodeThrift([[1, { type: "i32", value: 1 }]])]).toEqual([0x15, 0x02, 0x00]);
    expect([...encodeThrift([[1, { type: "i32", value: -1 }]])]).toEqual([0x15, 0x01, 0x00]);
    expect([...encodeThrift([[2, { type: "i64", value: 300 }]])]).toEqual([0x26, 0xd8, 0x04, 0x00]);
    expect([...encodeThrift([[1, { type: "binary", value: "ab" }]])]).toEqual([
      0x18, 0x02, 0x61, 0x62, 0x00,
    ]);
  });

  it("writes lists, nested structs and skips undefined fields", () => {
    const bytes = encodeThrift([
      [
        1,
        {
          type: "list",
          element: "i32",
          items: [
            { type: "i32", value: 0 },
            { type: "i32", value: 3 },
          ],
        },
      ],
      [2, undefined],
      [3, { type: "struct", fields: [[1, { type: "i32", value: 2 }]] }],
    ]);
    expect([...bytes]).toEqual([0x19, 0x25, 0x00, 0x06, 0x2c, 0x15, 0x04, 0x00, 0x00]);
  });

  it("writes a long list size and a long field-id jump", () => {
    const items = Array.from({ length: 15 }, () => ({ type: "i32" as const, value: 0 }));
    const bytes = encodeThrift([[1, { type: "list", element: "i32", items }]]);
    expect([...bytes.subarray(0, 3)]).toEqual([0x19, 0xf5, 0x0f]);
    expect([...encodeThrift([[20, { type: "i32", value: 1 }]])]).toEqual([0x05, 0x28, 0x02, 0x00]);
  });

  it("refuses field ids that do not ascend", () => {
    expect(() =>
      encodeThrift([
        [2, { type: "i32", value: 1 }],
        [1, { type: "i32", value: 1 }],
      ]),
    ).toThrow(RangeError);
  });
});
