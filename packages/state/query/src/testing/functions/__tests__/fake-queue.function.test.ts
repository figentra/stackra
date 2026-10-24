/**
 * Stackra file contract:
 * Purpose: unit tests of `fakeQueue`: a fresh `QueueFake` per call with the seeded counts, the shape the template's
 *          tests pass to the render helpers (`fakeQueue({ pending: 1 })`).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { fakeQueue } from "#testing/functions/fake-queue.function";
import { QueueFake } from "#testing/queue.fake";

describe("fakeQueue", () => {
  it("builds a fresh fake with the seeded counts", () => {
    const queue = fakeQueue({ pending: 1 });
    expect(queue).toBeInstanceOf(QueueFake);
    expect(queue.pending).toBe(1);
    expect(queue.conflicts).toEqual([]);
    expect(fakeQueue({ pending: 1 })).not.toBe(queue);
    expect(fakeQueue().pending).toBe(0);
  });
});
