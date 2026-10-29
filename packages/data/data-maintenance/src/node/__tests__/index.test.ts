/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: the six jobs with their input and output schemas and the
 *          `searchReindex` runner are its values, and nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0294 (decision 15); ADR 0462 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/data-maintenance/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual([
      "MaintainChangeLogAction",
      "MaintainChangeLogInput",
      "MaintainChangeLogOutput",
      "MaintainPartitionsAction",
      "MaintainPartitionsInput",
      "MaintainPartitionsOutput",
      "PruneOutboxAction",
      "PruneOutboxInput",
      "PruneOutboxOutput",
      "PruneRecordsAction",
      "PruneRecordsInput",
      "PruneRecordsOutput",
      "ReindexSearchAction",
      "ReindexSearchInput",
      "ReindexSearchOutput",
      "ReindexSemanticAction",
      "searchReindex",
    ]);
  });
});
