/**
 * Stackra file contract:
 * Purpose: unit tests of `QueueFake`: a real `MutationQueue`, open and seeded synchronously with waiting calls and
 *          conflicts, whose drain keeps every call (it reaches no server) and whose `discard` behaves as the app's.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0266.
 */
import { describe, expect, it } from "@stackra/testing";

import { MutationQueue } from "#core/index";
import { QueueFake } from "#testing/queue.fake";

describe("QueueFake", () => {
  it("is a mutation queue seeded at once", () => {
    const queue = QueueFake.with({ pending: 2, conflicts: 1 });
    expect(queue).toBeInstanceOf(MutationQueue);
    expect(queue.pending).toBe(2);
    expect(queue.items.map((item) => item.id)).toEqual(["fake_mutation_1", "fake_mutation_2"]);
    expect(queue.conflicts).toHaveLength(1);
    expect(queue.conflicts[0]).toMatchObject({ id: "fake_mutation_3", code: "fake_conflict" });
  });

  it("keeps every call on a drain and discards like the app", async () => {
    const queue = QueueFake.with({ pending: 1, conflicts: 1 });
    await queue.drain();
    expect(queue.pending).toBe(1);
    await queue.discard("fake_mutation_2");
    expect(queue.conflicts).toEqual([]);
  });

  it("starts empty without options", () => {
    const queue = QueueFake.with();
    expect(queue.pending).toBe(0);
    expect(queue.conflicts).toEqual([]);
  });
});
