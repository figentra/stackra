/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: `fakeQueue` is its one value, and the fake and its options
 *          resolve as types.
 * Boundary: test only; imports the stand-in barrel through its `#testing` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { MutationQueue } from "#core/index";
import * as testing from "#testing/index";
import type { FakeQueueOptions, QueueFake } from "#testing/index";

describe("@stackra/query/testing", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(testing).sort()).toEqual(["fakeQueue"]);
  });

  it("resolves the fake and its options", () => {
    expectTypeOf<QueueFake>().toExtend<MutationQueue>();
    expectTypeOf<keyof FakeQueueOptions>().toEqualTypeOf<"pending" | "conflicts">();
  });
});
