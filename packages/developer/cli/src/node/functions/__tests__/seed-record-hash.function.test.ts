/**
 * Stackra file contract:
 * Purpose: unit tests of `seedRecordHash`: key order and the file do not change the hash; a value does.
 * Boundary: test only; pure values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0325 (decision 7).
 */
import { describe, expect, it } from "@stackra/testing";

import { seedRecordHash } from "#node/functions/seed-record-hash.function";

describe("seedRecordHash", () => {
  it("hashes content, not layout", () => {
    const a = seedRecordHash({
      kind: "settings",
      key: "k",
      rows: [{ id: "x", answer: "C8", value: { a: 1, b: 2 } }],
    });
    const b = seedRecordHash({
      kind: "settings",
      key: "k",
      rows: [{ value: { b: 2, a: 1 }, answer: "C8", id: "x" }],
    });
    const c = seedRecordHash({
      kind: "settings",
      key: "k",
      rows: [{ id: "x", answer: "C8", value: { a: 1, b: 3 } }],
    });
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(b).toBe(a);
    expect(c).not.toBe(a);
  });
});
