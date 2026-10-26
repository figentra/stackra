/**
 * Stackra file contract:
 * Purpose: unit tests of the `SearchDriver` port: an abstract `Port`, so a driver extending it is a `SearchDriver` to
 *          every consumer and answers through the four members.
 * Boundary: test only; a minimal driver stands in for the real ones.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16); ADR 0221.
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { SearchDriver } from "#contracts/ports/search-driver.port";
import type { SearchFacets } from "#contracts/types/search-facets.type";
import type { SearchRequest } from "#contracts/types/search-request.type";

/** Answers every search with the first word, as an id. */
class EchoSearchDriver extends Driver(SearchDriver) {
  async search(_table: unknown, request: SearchRequest): Promise<readonly string[]> {
    return request.words.slice(0, 1);
  }

  async facets(): Promise<SearchFacets> {
    return { status: { active: 1 } };
  }

  async index(): Promise<void> {}

  async remove(): Promise<void> {}
}

describe("SearchDriver", () => {
  it("is a port a driver extends", async () => {
    const driver = new EchoSearchDriver();
    expect(driver).toBeInstanceOf(SearchDriver);
    expect(driver).toBeInstanceOf(Port);
    await expect(
      driver.search(
        { table: "products", primaryKey: "id" },
        { words: ["shirt"], filters: {}, offset: 0, limit: 1 },
      ),
    ).resolves.toEqual(["shirt"]);
    await expect(
      driver.facets(
        { table: "products", primaryKey: "id" },
        { words: [], filters: {}, paths: ["status"], limit: 10 },
      ),
    ).resolves.toEqual({ status: { active: 1 } });
  });
});
