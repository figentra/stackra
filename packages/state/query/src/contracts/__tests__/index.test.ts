/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the ports the template imports (`QueryPersister`,
 *          `QueueLeader`) and the `MutationSender` the generated client implements are exported, nothing else is, and
 *          the `ReplayOutcome` type resolves.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { ReplayOutcome } from "#contracts/index";

describe("@stackra/query/contracts", () => {
  it("exports exactly its ports", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "MutationSender",
      "QueryPersister",
      "QueueLeader",
    ]);
  });

  it("resolves its public types", () => {
    expectTypeOf<ReplayOutcome["ok"]>().toEqualTypeOf<boolean>();
  });
});
