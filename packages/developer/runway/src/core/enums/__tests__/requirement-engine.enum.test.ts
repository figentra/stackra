/**
 * Stackra file contract:
 * Purpose: unit tests of `RequirementEngine`: only postgres and valkey; no engine ADR 0227 defers.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 5); ADR 0227.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RequirementEngine } from "#core/enums/requirement-engine.enum";

describe("RequirementEngine", () => {
  it("allows postgres and valkey only", () => {
    expect(Enum.values(RequirementEngine)).toEqual(["postgres", "valkey"]);
  });

  it("holds no deferred engine", () => {
    for (const deferred of [
      "typesense",
      "meilisearch",
      "opensearch",
      "kafka",
      "nats",
      "redpanda",
    ]) {
      expect(Enum.values(RequirementEngine)).not.toContain(deferred);
    }
  });
});
