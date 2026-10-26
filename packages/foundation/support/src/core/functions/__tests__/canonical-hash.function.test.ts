/**
 * Stackra file contract:
 * Purpose: unit tests of `canonicalHash`: 64 lowercase hex, the SHA-256 of the canonical text, and equal for equal
 *          values in any key order.
 * Boundary: test only; the expected digest is computed with `node:crypto`, independently of the subject.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0212 (decision 3).
 */
import { createHash } from "node:crypto";

import { describe, expect, it } from "@stackra/testing";

import { canonicalHash } from "#core/functions/canonical-hash.function";

describe("canonicalHash", () => {
  it("is the SHA-256 of the canonical text", async () => {
    const expected = createHash("sha256").update('{"a":1,"b":[2]}', "utf8").digest("hex");
    await expect(canonicalHash({ b: [2], a: 1 })).resolves.toBe(expected);
  });

  it("is 64 lowercase hex and ignores key order", async () => {
    const one = await canonicalHash({ sequence: 1, previousHash: "0".repeat(64) });
    expect(one).toMatch(/^[0-9a-f]{64}$/);
    await expect(canonicalHash({ previousHash: "0".repeat(64), sequence: 1 })).resolves.toBe(one);
  });
});
