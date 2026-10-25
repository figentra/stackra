/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: `useMutationQueue` and `useReplica` are its values, and the
 *          queue's record types the template imports from here (`ConflictRecord`, `PendingMutation`) and the replica's
 *          `ReplicaSnapshot` resolve with the fields the screens read.
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import type { Json } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as react from "#react/index";
import type { ConflictRecord, PendingMutation, ReplicaSnapshot } from "#react/index";

describe("@stackra/query/react", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(react).sort()).toEqual(["useMutationQueue", "useReplica"]);
  });

  it("resolves the queue's record types", () => {
    expectTypeOf<PendingMutation["id"]>().toEqualTypeOf<string>();
    expectTypeOf<PendingMutation["input"]>().toEqualTypeOf<Json>();
    expectTypeOf<ConflictRecord["action"]>().toEqualTypeOf<string>();
    expectTypeOf<ConflictRecord["server"]>().toEqualTypeOf<Json | null>();
    expectTypeOf<ConflictRecord>().toExtend<PendingMutation>();
    expectTypeOf<PendingMutation["sequence"]>().toEqualTypeOf<number | null>();
    expectTypeOf<ReplicaSnapshot["asOf"]>().toEqualTypeOf<Date | null>();
  });
});
