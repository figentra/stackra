/**
 * Stackra file contract:
 * Purpose: `nodeBodyStream`, a Node request's body (an `IncomingMessage`, or Encore's `RawRequest`) as a Fetch
 *          `ReadableStream`, read through plain `data` / `end` / `error` / `close` listeners with backpressure: the
 *          request is paused while the web stream's queue is full and resumed on the next pull. `Readable.toWeb` and
 *          async iteration both run Node's end-of-stream, whose cleanup calls `stream.req.removeListener`; Encore's
 *          `RawRequest` keeps its native request in `req`, which is no emitter, so every request with a body crashed
 *          the service (STA-2794).
 * Boundary: streams, never buffers and never caps: the cap is `readCappedBody`'s, under `HttpConfig.maxBodyBytes`,
 *           and like it a capped read leaves the request open for the server to answer. Cancelling the web stream
 *           destroys the request. A request that closes before its end errors the stream rather than ending it, so a
 *           cut-off upload is never read as a whole body.
 * Runtime: node
 * Governing contract: ADR 0237 (STA-2577 note: the body is streamed to `serveGuardedCall`, read once under a cap);
 *                     STA-2794.
 */
import type { Readable } from "node:stream";

/**
 * `request`'s body as a web stream of bytes.
 *
 * @param request - the Node request; its body is read from its `data` events, nothing else of it is touched.
 * @example
 * new Request(url, { method, headers, body: nodeBodyStream(req), duplex: "half" } as RequestInit);
 */
export function nodeBodyStream(request: Readable): ReadableStream<Uint8Array> {
  let settled = false;
  /** Runs `finish` only for the first of end, error and close. */
  const settle = (finish: () => void): void => {
    if (settled) return;
    settled = true;
    finish();
  };
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      // Already read to its end (a bodyless request a framework drained first): an empty body.
      if (request.readableEnded) return settle(() => controller.close());
      request.on("data", (chunk: Uint8Array | string) => {
        if (settled) return;
        // A copy: a Buffer chunk may be a view over Node's shared pool.
        controller.enqueue(
          typeof chunk === "string" ? encoder.encode(chunk) : new Uint8Array(chunk),
        );
        if ((controller.desiredSize ?? 1) <= 0) request.pause();
      });
      request.once("end", () => settle(() => controller.close()));
      request.once("error", (error: unknown) => settle(() => controller.error(error)));
      request.once("close", () =>
        settle(() => controller.error(new Error("The request closed before its body ended."))),
      );
    },
    pull() {
      request.resume();
    },
    cancel() {
      settled = true;
      request.destroy();
    },
  });
}
