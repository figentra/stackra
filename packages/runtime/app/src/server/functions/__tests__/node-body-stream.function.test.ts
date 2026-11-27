/**
 * Stackra file contract:
 * Purpose: unit tests of `nodeBodyStream` over a stand-in of Encore's `RawRequest` (a `Readable` whose `req` is the
 *          native request, no emitter): its body reads whole and ends without the end-of-stream crash (STA-2794), the
 *          request is paused while the queue is full, an error or an early close errors the stream, a cancel destroys
 *          the request, and `readCappedBody` over it still answers undefined past the cap.
 * Boundary: test only; in-memory Node streams.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0237 (STA-2577 note); STA-2794.
 */
import { Readable } from "node:stream";
import { setImmediate as tick } from "node:timers/promises";

import { describe, expect, it } from "@stackra/testing";

import { nodeBodyStream } from "#server/functions/node-body-stream.function";
import { readCappedBody } from "#server/functions/read-capped-body.function";

/**
 * Encore's `RawRequest` in miniature: a `Readable` that keeps its native request, no emitter, in `req`. After its
 * chunks it ends, fails with `tail`, or (`"hang"`) waits for more that never come.
 */
class RawRequestLike extends Readable {
  readonly req = { meta: (): Record<string, never> => ({}) };

  reads = 0;

  constructor(
    private readonly chunks: (string | Buffer)[],
    private readonly tail: "end" | "hang" | Error = "end",
  ) {
    super();
  }

  override _read(): void {
    this.reads += 1;
    const next = this.chunks.shift();
    if (next !== undefined) this.push(next);
    else if (this.tail === "end") this.push(null);
    else if (this.tail instanceof Error) this.destroy(this.tail);
  }
}

/** Every byte of `body`, as text. */
async function text(body: ReadableStream<Uint8Array>): Promise<string> {
  return new Response(body).text();
}

describe(nodeBodyStream, () => {
  it("reads a RawRequest's body whole and ends it, with no end-of-stream crash", async () => {
    const request = new RawRequestLike([Buffer.from('{"text":'), '"hello"}']);
    await expect(text(nodeBodyStream(request))).resolves.toBe('{"text":"hello"}');
    // Nothing threw on a later tick, when Node's end-of-stream cleanup would have.
    await tick();
  });

  it("carries a body into a Fetch Request the way the adapter builds it", async () => {
    const request = new Request("http://encore/notes", {
      method: "POST",
      body: nodeBodyStream(new RawRequestLike(['{"text":"hello"}'])),
      duplex: "half",
    } as RequestInit);
    await expect(request.json()).resolves.toEqual({ text: "hello" });
  });

  it("pauses the request while the queue is full and resumes it on the next read", async () => {
    // Past Node's own read-ahead (its high-water mark), so only the pause stops the reading.
    const request = new RawRequestLike(Array.from({ length: 100 }, () => Buffer.alloc(16_384)));
    const reader = nodeBodyStream(request).getReader();
    await tick();
    expect(request.isPaused()).toBe(true);
    expect(request.reads).toBeLessThan(100);
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
    }
    expect(size).toBe(100 * 16_384);
  });

  it("errors the stream when the request errors", async () => {
    const request = new RawRequestLike(["{"], new Error("connection reset"));
    await expect(text(nodeBodyStream(request))).rejects.toThrow("connection reset");
  });

  it("errors the stream when the request closes before its body ends", async () => {
    const request = new RawRequestLike(["{"], "hang");
    const body = text(nodeBodyStream(request));
    request.destroy();
    await expect(body).rejects.toThrow("closed before its body ended");
  });

  it("destroys the request when the stream is cancelled", async () => {
    const request = new RawRequestLike(["a", "b", "c"]);
    await nodeBodyStream(request).cancel();
    expect(request.destroyed).toBe(true);
  });

  it("is an empty body for a request already read to its end", async () => {
    const request = new RawRequestLike([]);
    request.resume();
    await new Promise((resolve) => {
      request.once("end", resolve);
    });
    await expect(text(nodeBodyStream(request))).resolves.toBe("");
  });

  it("keeps readCappedBody's cap: past it is undefined, and the request is left open", async () => {
    const request = new RawRequestLike(Array.from({ length: 100 }, () => Buffer.alloc(100)));
    expect(await readCappedBody(nodeBodyStream(request), 250)).toBeUndefined();
    expect(request.destroyed).toBe(false);
  });
});
