/**
 * Stackra file contract:
 * Purpose: unit tests of `RequirementEngine`: postgres, valkey, s3 and sns-sqs, in the canonical schemas' order, and no
 *          engine ADR 0227 defers.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 5 and its 2026-10-24 note); ADR 0227.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RequirementEngine } from "#core/enums/requirement-engine.enum";

describe("RequirementEngine", () => {
  it("allows the engines ADR 0296 lists", () => {
    expect(Enum.values(RequirementEngine)).toEqual(["postgres", "valkey", "s3", "sns-sqs"]);
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
