/**
 * Stackra file contract:
 * Purpose: the `sse` driver of the `RealtimeDriver` port: `open(request)` answers a GET of `REALTIME_PATH` with a
 *          `text/event-stream` response that carries each refresh as an `event: refresh` with the occurrence id, plus a
 *          comment heartbeat so proxies keep the stream open.
 * Boundary: web-standard `Request`, `Response` and `ReadableStream` only, so the generated raw endpoint of any runtime
 *           returns the response as is. The subscribe token comes from the `token` query parameter; an unknown, used
 *           or expired token gets 401 and no stream. A WebSocket upgrade gets 426 before the token is touched, so a
 *           client's socket attempt never burns the token its SSE fallback needs. The stream closes at token expiry.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1: SSE fallback); the WHATWG event-stream format.
 */
import { Driver } from "@stackra/container";

import { RealtimeDriver } from "#contracts/ports/realtime-driver.port";
import type { RealtimeBroadcast } from "#contracts/types/realtime-broadcast.type";
import { RealtimeHub } from "#core/services/realtime-hub.service";

/** How often a comment line keeps an idle stream alive, under the usual 30 to 60 second proxy timeouts. */
const HEARTBEAT_MS = 25_000;

/** The headers of an event stream. */
const STREAM_HEADERS = {
  "content-type": "text/event-stream; charset=utf-8",
  "cache-control": "no-store",
  "x-accel-buffering": "no",
};

/**
 * Serves sessions over server-sent events.
 *
 * @example
 * // in the generated raw endpoint for GET /realtime
 * return driver.open(request);
 */
export class SseRealtimeDriver extends Driver(RealtimeDriver) {
  /** The hub that holds this driver's sessions. */
  protected readonly hub: RealtimeHub;

  /** @param hub - the shared channel hub. */
  constructor(hub: RealtimeHub) {
    super();
    this.hub = hub;
  }

  /** Delivers `broadcast` to the connections that may receive it. */
  publish(broadcast: RealtimeBroadcast): Promise<number> {
    return Promise.resolve(this.hub.publish(broadcast));
  }

  /**
   * The event stream for `request`, or a refusal.
   *
   * @returns 200 with the stream; 426 for a WebSocket upgrade; 401 for a bad token.
   */
  open(request: Request): Response {
    if (request.headers.get("upgrade")?.toLowerCase() === "websocket")
      return new Response(null, { status: 426 });
    const token = new URL(request.url).searchParams.get("token") ?? "";
    const encoder = new TextEncoder();
    let controller: ReadableStreamDefaultController<Uint8Array> | undefined;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let closed = false;
    const send = (text: string): void => {
      if (!closed) controller?.enqueue(encoder.encode(text));
    };
    const end = (): void => {
      if (closed) return;
      closed = true;
      clearInterval(heartbeat);
      controller?.close();
    };
    let leave: (() => void) | undefined;
    // `start` runs synchronously in the constructor, so the controller exists before the hub can deliver.
    const stream = new ReadableStream<Uint8Array>({
      start: (streamController) => {
        controller = streamController;
      },
      cancel: () => {
        closed = true;
        clearInterval(heartbeat);
        leave?.();
      },
    });
    leave = this.hub.join(token, {
      deliver: (message) =>
        send(`id: ${message.id}\nevent: refresh\ndata: ${JSON.stringify(message)}\n\n`),
      close: end,
    });
    if (leave === undefined) {
      void stream.cancel();
      return new Response(null, { status: 401 });
    }
    send(": open\n\n");
    heartbeat = setInterval(() => send(": ping\n\n"), HEARTBEAT_MS);
    return new Response(stream, { status: 200, headers: STREAM_HEADERS });
  }
}
