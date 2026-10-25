/**
 * Stackra file contract:
 * Purpose: unit tests of `sha256`: the known digest of "abc", bytes and text agree.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { sha256 } from "#core/functions/sha256.function";
import { toHex } from "#core/functions/to-hex.function";

describe("sha256", () => {
  it("digests text as UTF-8", async () => {
    expect(toHex(await sha256("abc"))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("gives the same digest for the same bytes", async () => {
    expect(await sha256(new TextEncoder().encode("abc"))).toEqual(await sha256("abc"));
    expect((await sha256("")).length).toBe(32);
  });
});
