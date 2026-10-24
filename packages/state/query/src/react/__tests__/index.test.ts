/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: `useMutationQueue` is its one value, and the queue's record
 *          types the template imports from here (`ConflictRecord`, `PendingMutation`) resolve with the fields the
 *          pending-changes view reads.
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import type { Json } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as react from "#react/index";
import type { ConflictRecord, PendingMutation } from "#react/index";

describe("@stackra/query/react", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(react).sort()).toEqual(["useMutationQueue"]);
  });

  it("resolves the queue's record types", () => {
    expectTypeOf<PendingMutation["id"]>().toEqualTypeOf<string>();
    expectTypeOf<PendingMutation["input"]>().toEqualTypeOf<Json>();
    expectTypeOf<ConflictRecord["action"]>().toEqualTypeOf<string>();
    expectTypeOf<ConflictRecord["server"]>().toEqualTypeOf<Json | null>();
    expectTypeOf<ConflictRecord>().toExtend<PendingMutation>();
  });
});
