/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryJsonWebKeysDriver`: it starts empty, answers the key of a held `kid` and null for any
 *          other.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0266; ADR 0269; ADR 0206 (decision 8).
 */
import { describe, expect, it } from "@stackra/testing";

import { MemoryJsonWebKeysDriver } from "#server/drivers/memory-json-web-keys.driver";

describe("MemoryJsonWebKeysDriver", () => {
  it("answers the key of a held kid and null for any other", async () => {
    const keys = new MemoryJsonWebKeysDriver();
    expect(await keys.find("k1")).toBeNull();
    keys.keys = [{ kid: "k1", kty: "RSA" }];
    expect(await keys.find("k1")).toEqual({ kid: "k1", kty: "RSA" });
    expect(await keys.find("k2")).toBeNull();
  });
});
