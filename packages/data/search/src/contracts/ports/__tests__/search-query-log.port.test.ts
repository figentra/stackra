/**
 * Stackra file contract:
 * Purpose: unit tests of the `SearchQueryLog` port: an abstract `Port`, so a driver extending it is a `SearchQueryLog`
 *          to every consumer and answers through `record` and `popular`.
 * Boundary: test only; a minimal driver stands in for the real ones.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16); stackra-326.
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { SearchQueryLog } from "#contracts/ports/search-query-log.port";
import type { SearchQueryEntry } from "#contracts/types/search-query-entry.type";

/** Keeps every entry and completes from the phrases it kept. */
class ListSearchQueryLog extends Driver(SearchQueryLog) {
  readonly entries: SearchQueryEntry[] = [];

  async record(entry: SearchQueryEntry): Promise<void> {
    this.entries.push(entry);
  }

  async popular(model: string, prefix: string): Promise<readonly string[]> {
    return this.entries
      .filter((entry) => entry.model === model && entry.phrase?.startsWith(prefix) === true)
      .map((entry) => entry.phrase ?? "");
  }
}

describe("SearchQueryLog", () => {
  it("is a port a driver extends", async () => {
    const log = new ListSearchQueryLog();
    expect(log).toBeInstanceOf(SearchQueryLog);
    expect(log).toBeInstanceOf(Port);
    await log.record({ model: "Product", phrase: "linen shirt", hits: 3, latencyMs: 12 });
    await expect(log.popular("Product", "lin", 5)).resolves.toEqual(["linen shirt"]);
  });
});
