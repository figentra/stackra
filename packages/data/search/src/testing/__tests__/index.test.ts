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
  it("exports the conformance suites and the evaluation set", () => {
    expect(Object.keys(testing).sort()).toEqual([
      "SEARCH_CONFORMANCE_CASES",
      "SEARCH_CONFORMANCE_DOCUMENTS",
      "SEARCH_EVALUATION_CATALOGUE",
      "SEARCH_EVALUATION_QUERIES",
      "SEARCH_EVALUATION_SYNONYMS",
      "SEARCH_EVALUATION_THRESHOLDS",
      "ndcgAt",
      "recallAt",
      "runRerankerConformance",
      "runSearchConformance",
      "searchConformanceTable",
    ]);
  });
});
