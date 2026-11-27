/**
 * Stackra file contract:
 * Purpose: unit tests of `readCappedBody`: a body within the cap is returned whole, one past it is
 *          undefined after reading no more than needed, no body is empty bytes, and an aborted signal (the body read
 *          deadline) rejects the read even while a chunk is still awaited (STA-1467).
 * Boundary: test only; plain web streams.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0237 (STA-2577 note); STA-1467.
 */
import { describe, expect, it } from "@stackra/testing";

import { readCappedBody } from "#server/functions/read-capped-body.function";

/** A stream of `count` chunks of `size` bytes, counting how many were pulled. */
function stream(count: number, size: number) {
  const state = { pulled: 0 };
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (state.pulled === count) return controller.close();
      state.pulled += 1;
      controller.enqueue(new Uint8Array(size));
    },
  });
  return { body, state };
}

describe(readCappedBody, () => {
  it("returns a body within the cap whole", async () => {
    const { body } = stream(3, 10);
    expect((await readCappedBody(body, 30))?.byteLength).toBe(30);
  });

  it("returns undefined past the cap and stops pulling", async () => {
    const { body, state } = stream(1000, 10);
    expect(await readCappedBody(body, 25)).toBeUndefined();
    expect(state.pulled).toBeLessThan(10);
  });

  it("returns empty bytes for no body", async () => {
    expect((await readCappedBody(null, 10))?.byteLength).toBe(0);
  });

  it("rejects with the signal's reason once it aborts while a chunk is still awaited", async () => {
    const stalled = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(4));
      },
    });
    const deadline = new AbortController();
    const read = readCappedBody(stalled, 1024, deadline.signal);
    deadline.abort(new Error("too slow"));
    await expect(read).rejects.toThrow("too slow");
  });

  it("rejects at once for a signal that already aborted, and reads a whole body under one that did not", async () => {
    await expect(
      readCappedBody(stream(1, 1).body, 10, AbortSignal.abort(new Error("gone"))),
    ).rejects.toThrow("gone");
    expect(
      (await readCappedBody(stream(2, 5).body, 10, new AbortController().signal))?.byteLength,
    ).toBe(10);
  });
});
