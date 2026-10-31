/**
 * Stackra file contract:
 * Purpose: unit tests of `readZip`: a deflated and a stored entry from `writeZip` read back byte for byte, a missing
 *          name is `undefined`, and bytes that are not a zip are refused (STA-1736).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { writeZip } from "#core/functions/write-zip.function";
import { readZip } from "#node/functions/read-zip.function";

describe("readZip", () => {
  it("reads deflated and stored entries, and nothing for a missing name", async () => {
    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [];
    for await (const chunk of writeZip(
      [
        {
          name: "a/مرحبا.txt",
          bytes: [encoder.encode("hello "), encoder.encode("world".repeat(50))],
        },
        { name: "b.bin", bytes: [new Uint8Array([1, 2, 3])], method: "store" },
      ],
      new Date(Date.UTC(2026, 9, 25)),
    ))
      chunks.push(chunk);
    const file = readZip(Buffer.concat(chunks));
    expect(new TextDecoder().decode(file("a/مرحبا.txt"))).toBe(`hello ${"world".repeat(50)}`);
    expect([...(file("b.bin") ?? [])]).toEqual([1, 2, 3]);
    expect(file("c.txt")).toBeUndefined();
  });

  it("refuses bytes that are not a zip", () => {
    expect(() => readZip(new TextEncoder().encode("not a zip at all, just text"))).toThrow(
      TypeError,
    );
  });
});
