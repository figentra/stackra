/**
 * Stackra file contract:
 * Purpose: unit tests of `hashApiKey`: the SHA-256 of the key text as 64 lowercase hex characters (the RFC 6234 test
 *          vector for "abc"), the same for the same key and different for another.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0278 (decision 3); ADR 0410.
 */
import { describe, expect, it } from "@stackra/testing";

import { hashApiKey } from "#core/functions/hash-api-key.function";

describe(hashApiKey, () => {
  it("is the SHA-256 of the key, lowercase hex", async () => {
    expect(await hashApiKey("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("is deterministic per key", async () => {
    expect(await hashApiKey("stackra_sk_a")).toBe(await hashApiKey("stackra_sk_a"));
    expect(await hashApiKey("stackra_sk_a")).not.toBe(await hashApiKey("stackra_sk_b"));
  });
});
