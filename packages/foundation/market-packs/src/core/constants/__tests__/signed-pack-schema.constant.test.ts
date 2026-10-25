/**
 * Stackra file contract:
 * Purpose: unit tests of `SIGNED_PACK_SCHEMA`: it accepts a pack with a hex hash and a base64 signature, and refuses a bad hash, a bad signature or a missing key id.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. Pack
 *           data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { describe, expect, it } from "@stackra/testing";

import { SIGNED_PACK_SCHEMA } from "#core/constants/signed-pack-schema.constant";

const valid = {
  pack: { market: "xa", version: "1.0.0", status: "live", entries: [] },
  hash: "a".repeat(64),
  signature: { keyId: "key_1", value: "c2lnbmF0dXJl" },
};

describe("SIGNED_PACK_SCHEMA", () => {
  it("accepts a signed pack", () => {
    expect(SIGNED_PACK_SCHEMA.parse(valid).pack.reviews).toEqual([]);
  });

  it.each([
    ["a short hash", { hash: "a".repeat(63) }],
    ["an upper-case hash", { hash: "A".repeat(64) }],
    ["a signature that is not base64", { signature: { keyId: "key_1", value: "not base64!" } }],
    ["an empty key id", { signature: { keyId: "", value: "c2lnbmF0dXJl" } }],
    ["a pack of the wrong shape", { pack: { market: "xa" } }],
  ])("refuses %s", (_name, change) => {
    expect(SIGNED_PACK_SCHEMA.safeParse({ ...valid, ...change }).success).toBe(false);
  });
});
