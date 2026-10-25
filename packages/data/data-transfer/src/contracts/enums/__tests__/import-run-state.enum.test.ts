/**
 * Stackra file contract:
 * Purpose: unit tests of `ImportRunState`: its four snake_case codes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decisions 7 and 8).
 */
import { describe, expect, it } from "@stackra/testing";

import { ImportRunState } from "#contracts/enums/import-run-state.enum";

describe("ImportRunState", () => {
  it("has the four run states", () => {
    expect([
      ImportRunState.Running,
      ImportRunState.Failed,
      ImportRunState.Finished,
      ImportRunState.Reverted,
    ]).toEqual(["running", "failed", "finished", "reverted"]);
  });
});
