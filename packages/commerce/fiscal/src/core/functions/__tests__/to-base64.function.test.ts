/**
 * Stackra file contract:
 * Purpose: unit tests of `toBase64`: padded base64 of text and bytes, including a payload larger than one chunk.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { fromBase64 } from "#core/functions/from-base64.function";
import { toBase64 } from "#core/functions/to-base64.function";

describe("toBase64", () => {
  it("encodes text as UTF-8 with padding", () => {
    expect(toBase64("hi")).toBe("aGk=");
    expect(toBase64("é")).toBe("w6k=");
  });

  it("encodes a payload larger than one chunk", () => {
    const bytes = Uint8Array.from({ length: 70_000 }, (_, index) => index % 256);
    expect(fromBase64(toBase64(bytes))).toEqual(bytes);
  });
});
