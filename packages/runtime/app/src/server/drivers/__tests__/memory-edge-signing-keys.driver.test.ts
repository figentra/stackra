/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryEdgeSigningKeysDriver`: it starts with no secret and answers the ones set, newest
 *          first.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0437 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { MemoryEdgeSigningKeysDriver } from "#server/drivers/memory-edge-signing-keys.driver";

describe("MemoryEdgeSigningKeysDriver", () => {
  it("answers no secret until one is set, then the set ones in order", async () => {
    const keys = new MemoryEdgeSigningKeysDriver();
    expect(await keys.active()).toEqual([]);
    keys.secrets = ["next", "previous"];
    expect(await keys.active()).toEqual(["next", "previous"]);
  });
});
