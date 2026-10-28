/**
 * Stackra file contract:
 * Purpose: unit tests of `runSearchConformance`: the memory driver passes every case, a driver that answers a
 *          visibility-bound request is reported, a driver that throws while seeding is reported per case, and a SQL
 *          driver skips the refusal case.
 * Boundary: test only; in memory, no engine or network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0089 (decision 5); ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import type { SearchRequest, SearchTable } from "#contracts/index";
import { MemorySearchDriver } from "#core/drivers/memory-search.driver";
import { runSearchConformance } from "#testing/run-search-conformance.function";
import { SEARCH_CONFORMANCE_CASES } from "#testing/search-conformance-cases.constant";

/** A memory driver that ignores `visible` instead of refusing it. */
class LeakyDriver extends MemorySearchDriver {
  override async search(table: SearchTable, request: SearchRequest): Promise<readonly string[]> {
    const { visible: _visible, ...rest } = request;
    return super.search(table, rest);
  }
}

/** A memory driver that ignores `scopePaths`, as an engine without a scope field would. */
class UnscopedDriver extends MemorySearchDriver {
  override async search(table: SearchTable, request: SearchRequest): Promise<readonly string[]> {
    const { scopePaths: _scopePaths, ...rest } = request;
    return super.search(table, rest);
  }
}

describe("runSearchConformance", () => {
  it("passes the memory driver on every case", async () => {
    const results = await runSearchConformance(() => new MemorySearchDriver());
    expect(results.map((result) => result.caseId)).toEqual(
      SEARCH_CONFORMANCE_CASES.map((c) => c.id),
    );
    expect(results.flatMap((result) => result.mismatches)).toEqual([]);
  });

  it("reports a driver that ranks a request carrying visibility", async () => {
    const results = await runSearchConformance(() => new LeakyDriver());
    const refused = results.find((result) => result.caseId === "visibility.refused");
    expect(refused?.mismatches).toEqual([
      "search: a request carrying visibility was answered, not refused",
    ]);
  });

  it("reports a driver that answers across scopes", async () => {
    const results = await runSearchConformance(() => new UnscopedDriver());
    const isolated = results.find((result) => result.caseId === "scope.isolated");
    expect(isolated?.mismatches.length).toBeGreaterThan(0);
    const facets = results.find((result) => result.caseId === "facets.scoped");
    expect(facets?.mismatches).toEqual([]);
  });

  it("skips the refusal case for a driver that applies visibility", async () => {
    const results = await runSearchConformance(() => new LeakyDriver(), {
      appliesVisibility: true,
    });
    expect(results.flatMap((result) => result.mismatches)).toEqual([]);
  });

  it("reports a thrown seed as a miss of each case, not a crash", async () => {
    const results = await runSearchConformance(() => {
      throw new Error("engine down");
    });
    expect(results).toHaveLength(SEARCH_CONFORMANCE_CASES.length);
    expect(new Set(results.flatMap((result) => result.mismatches))).toEqual(
      new Set(["threw: engine down"]),
    );
  });
});
