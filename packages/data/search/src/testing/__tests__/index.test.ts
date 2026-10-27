/**
 * Stackra file contract:
 * Purpose: the export list of the `./testing` stand-in barrel of @stackra/search, so a name never drops out unseen.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as testing from "#testing/index";

describe("@stackra/search/testing", () => {
  it("exports the conformance suite", () => {
    expect(Object.keys(testing).sort()).toEqual([
      "SEARCH_CONFORMANCE_CASES",
      "SEARCH_CONFORMANCE_DOCUMENTS",
      "runSearchConformance",
      "searchConformanceTable",
    ]);
  });
});
