/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the ports the template imports (`QueryPersister`,
 *          `QueueLeader`), the ones the generated client implements (`MutationSender`, `AcknowledgementReader`,
 *          `ReplicaSource`) and identity's `OfflineSession` are exported, nothing else is, and the types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { DeviceOrder, ReplayOutcome, ReplicaChanges, ReplicaRow } from "#contracts/index";

describe("@stackra/query/contracts", () => {
  it("exports exactly its ports", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "AcknowledgementReader",
      "MutationSender",
      "OfflineSession",
      "QueryPersister",
      "QueueLeader",
      "ReplicaSource",
    ]);
  });

  it("resolves its public types", () => {
    expectTypeOf<ReplayOutcome["ok"]>().toEqualTypeOf<boolean>();
    expectTypeOf<DeviceOrder["sequence"]>().toEqualTypeOf<number>();
    expectTypeOf<ReplicaChanges["rows"]>().toEqualTypeOf<readonly ReplicaRow[]>();
    expectTypeOf<ReplicaChanges["full"]>().toEqualTypeOf<boolean>();
  });
});
