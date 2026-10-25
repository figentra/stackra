/**
 * Stackra file contract:
 * Purpose: unit tests of `sha256Hex`: the known digest of a known input.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { sha256Hex } from "#core/functions/sha256-hex.function";

describe("sha256Hex", () => {
  it("hashes UTF-8 to lowercase hex", async () => {
    expect(await sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});
