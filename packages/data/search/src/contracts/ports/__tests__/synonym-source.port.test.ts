/**
 * Stackra file contract:
 * Purpose: unit tests of the `SynonymSource` port: an abstract `Port` whose driver answers the sets of an index.
 * Boundary: test only; a minimal driver stands in for a real one.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0492 (decision 5).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { SynonymSource } from "#contracts/ports/synonym-source.port";

/** Always answers one set. */
class OneSetSynonymSourceDriver extends Driver(SynonymSource) {
  async setsOf(_indexes: readonly string[]) {
    return [{ index: "products", language: "en", terms: ["sofa", "couch"] }];
  }
}

describe("SynonymSource", () => {
  it("is a port a driver extends", async () => {
    const source = new OneSetSynonymSourceDriver();
    expect(source).toBeInstanceOf(SynonymSource);
    expect(source).toBeInstanceOf(Port);
    await expect(source.setsOf(["products"])).resolves.toHaveLength(1);
  });
});
