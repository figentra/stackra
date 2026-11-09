/**
 * Stackra file contract:
 * Purpose: `eventStreamResponse(source)`, a `stream: true` action's answer as server-sent events: each chunk of `source`
 *          is one `data:` event of its JSON, the end is `data: [DONE]`, and a `: ping` comment goes out when nothing was
 *          written for 15 seconds, so a proxy or load balancer never closes an idle answer. The chunks are the AI SDK's
 *          UI message stream protocol, which the header names.
 * Boundary: the answer is never stored or transformed on the way: `Cache-Control: no-store`, `Content-Encoding:
 *           identity` and `X-Accel-Buffering: no`. A failure of `source` after the first byte cannot change the status,
 *           so it is one `error` chunk (`stream_failed`, never the error's text) and the end; the handler records the
 *           outcome itself. A caller that goes away cancels `source`, which ends the handler's loop.
 * Runtime: node
 * Governing contract: ADR 0237 (every generated adapter is raw); Tamo spec generative-ui-tools-artifacts (G1b: the SSE
 *                     adapter).
 */

/** Idle time after which a ping comment is written. */
const IDLE_MS = 15_000;

/** How often idleness is checked; a ping goes out between 15 and 20 seconds of quiet. */
const TICK_MS = 5000;

/** The headers of every event-stream answer. */
const HEADERS: Readonly<Record<string, string>> = Object.freeze({
  "content-type": "text/event-stream; charset=utf-8",
  "cache-control": "no-store",
  "content-encoding": "identity",
  "x-accel-buffering": "no",
  "x-vercel-ai-ui-message-stream": "v1",
});

/**
 * `source` answered as server-sent events.
 *
 * @param idleMs - the quiet time before a ping; tests shorten it.
 * @example
 * if (output instanceof ReadableStream) return eventStreamResponse(output);
 */
export function eventStreamResponse(
  source: ReadableStream<unknown>,
  idleMs: number = IDLE_MS,
): Response {
  const encoder = new TextEncoder();
  const reader = source.getReader();
  let last = Date.now();
  let timer: ReturnType<typeof setInterval> | undefined;
  const stop = () => {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
  };
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      timer = setInterval(
        () => {
          if (Date.now() - last < idleMs) return;
          last = Date.now();
          controller.enqueue(encoder.encode(": ping\n\n"));
        },
        Math.min(TICK_MS, idleMs),
      );
      // a waiting answer never keeps the process alive on its own
      (timer as { unref?: () => void }).unref?.();
    },
    async pull(controller) {
      try {
        const next = await reader.read();
        last = Date.now();
        if (next.done) {
          stop();
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(next.value)}\n\n`));
      } catch {
        // the status is already sent: say the stream failed, without the error's text, and end it
        stop();
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", errorText: "stream_failed" })}\n\n`,
          ),
        );
        controller.close();
      }
    },
    async cancel(reason) {
      stop();
      await reader.cancel(reason);
    },
  });
  return new Response(body, { status: 200, headers: HEADERS });
}
