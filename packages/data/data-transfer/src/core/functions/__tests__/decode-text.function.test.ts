/**
 * Stackra file contract:
 * Purpose: unit tests of `decodeText`: a character split across chunks, the BOM dropped, the legacy fallback decoded,
 *          and bytes the encoding cannot read refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { UnreadableEncodingError } from "#core/errors/unreadable-encoding.error";
import { decodeText } from "#core/functions/decode-text.function";

async function text(chunks: Uint8Array[], encoding?: string, fallback?: string): Promise<string> {
  let result = "";
  for await (const part of decodeText(chunks, encoding, fallback)) result += part;
  return result;
}

describe("decodeText", () => {
  it("carries a character split across chunks and drops the BOM", async () => {
    const bytes = new TextEncoder().encode("﻿مرحبا");
    expect(await text([bytes.subarray(0, 4), new Uint8Array(), bytes.subarray(4)])).toBe("مرحبا");
  });

  it("decodes the fallback encoding", async () => {
    expect(
      await text([new Uint8Array([0xe3, 0xd1, 0xcd, 0xc8, 0xc7])], undefined, "windows-1256"),
    ).toBe("مرحبا");
  });

  it("refuses bytes the given encoding cannot read", async () => {
    await expect(text([new Uint8Array([0x61, 0xc7, 0x62])], "utf-8")).rejects.toThrow(
      UnreadableEncodingError,
    );
  });
});
