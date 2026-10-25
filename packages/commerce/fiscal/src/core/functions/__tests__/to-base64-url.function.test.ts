/**
 * Stackra file contract:
 * Purpose: unit tests of `toBase64Url`: URL-safe characters and no padding.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { toBase64Url } from "#core/functions/to-base64-url.function";

describe("toBase64Url", () => {
  it("swaps + and / and drops padding", () => {
    expect(toBase64Url(new Uint8Array([251, 255]))).toBe("-_8");
    expect(toBase64Url("hi")).toBe("aGk");
  });
});
