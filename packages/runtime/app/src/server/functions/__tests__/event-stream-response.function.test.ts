/**
 * Stackra file contract:
 * Purpose: unit tests of `eventStreamResponse`: each chunk is one `data:` event of its JSON and the end is
 *          `data: [DONE]`, under headers that stop caching, compression and proxy buffering; a source that fails after
 *          the first byte ends with one `error` chunk that never carries the error's text; a quiet stream gets a
 *          `: ping` comment; and a caller that goes away cancels the source.
 * Boundary: test only; the sources are in-memory streams and the idle time is shortened.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; Tamo spec generative-ui-tools-artifacts (G1b: the SSE adapter).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { eventStreamResponse } from "#server/functions/event-stream-response.function";

/** The whole body of `response` as text. */
const textOf = (response: Response) => response.text();

/** A source that answers `chunks`, then ends. */
const sourceOf = (chunks: readonly unknown[]) =>
  new ReadableStream<unknown>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });

/** A `stream: true` action's answer as server-sent events. */
describe(eventStreamResponse, () => {
  /** One event per chunk, then the end marker, under no-store, identity and no-buffering headers. */
  it("writes each chunk as a data event and ends with DONE", async () => {
    const response = eventStreamResponse(
      sourceOf([{ type: "start" }, { type: "text-delta", id: "t1", delta: "Hi" }]),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/event-stream; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-encoding")).toBe("identity");
    expect(response.headers.get("x-accel-buffering")).toBe("no");
    expect(await textOf(response)).toBe(
      'data: {"type":"start"}\n\n' +
        'data: {"type":"text-delta","id":"t1","delta":"Hi"}\n\n' +
        "data: [DONE]\n\n",
    );
  });

  /** A failure after the first byte is one error chunk naming no detail. */
  it("ends a failed source with an error chunk and no error text", async () => {
    const source = new ReadableStream<unknown>({
      start(controller) {
        controller.enqueue({ type: "start" });
      },
      pull(controller) {
        controller.error(new RangeError("db password in here"));
      },
    });
    const text = await textOf(eventStreamResponse(source));
    expect(text).toBe(
      'data: {"type":"start"}\n\ndata: {"type":"error","errorText":"stream_failed"}\n\n',
    );
    expect(text).not.toContain("password");
  });

  /** Quiet for longer than the idle time, the answer writes a ping comment. */
  it("pings a quiet stream", async () => {
    let close: (() => void) | undefined;
    const source = new ReadableStream<unknown>({
      start(controller) {
        close = () => controller.close();
      },
    });
    const body = eventStreamResponse(source, 20).body?.getReader();
    const first = await body?.read();
    expect(new TextDecoder().decode(first?.value)).toBe(": ping\n\n");
    close?.();
    const rest = await body?.read();
    expect(new TextDecoder().decode(rest?.value)).toBe("data: [DONE]\n\n");
  });

  /** A caller that goes away cancels the source, which ends the handler's loop. */
  it("cancels the source when the caller goes away", async () => {
    const cancelled = vi.fn();
    const response = eventStreamResponse(new ReadableStream<unknown>({ cancel: cancelled }));
    await response.body?.cancel("gone");
    expect(cancelled).toHaveBeenCalledWith("gone");
  });
});
