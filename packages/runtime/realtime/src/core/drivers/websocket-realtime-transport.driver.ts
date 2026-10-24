/**
 * Stackra file contract:
 * Purpose: the `websocket` driver of the `RealtimeTransport` port: each link opens a `WebSocket` to `REALTIME_PATH`
 *          and, when the socket closes before it ever opened (a network or proxy that blocks sockets, or a service on
 *          the `sse` driver), falls back to a server-sent-events stream over `fetch` with the same one-time token.
 * Boundary: uses the platform's global `WebSocket` and `fetch` (browsers, React Native, Node 22+), so one driver
 *           serves web, desktop and mobile; the stream is read with `@stackra/transport`'s `readServerSentEvents`.
 *           Malformed frames and events other than `refresh` are dropped. The fallback is decided per link, so a
 *           passing network glitch never pins a client to SSE. A link the caller closes reports nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1: WebSocket with an SSE fallback); ADR 0260 (transport helpers).
 */
import { Driver } from "@stackra/container";
import { readServerSentEvents } from "@stackra/transport";

import { RealtimeTransport } from "#contracts/ports/realtime-transport.port";
import type { RealtimeLink } from "#contracts/types/realtime-link.type";
import type { RealtimeLinkHandlers } from "#contracts/types/realtime-link-handlers.type";
import type { RealtimeTarget } from "#contracts/types/realtime-target.type";
import { decodeMessage } from "#core/functions/decode-message.function";
import { realtimeUrl } from "#core/functions/realtime-url.function";

/**
 * Links over WebSocket, falling back to server-sent events.
 *
 * @example
 * const link = transport.open({ origin: "https://api.acme.example", token }, handlers);
 */
export class WebsocketRealtimeTransportDriver extends Driver(RealtimeTransport) {
  /**
   * Opens a socket to `target`; falls back to the event stream when it closes unopened.
   *
   * @throws TypeError when the origin is empty and there is no page origin.
   */
  open(target: RealtimeTarget, handlers: RealtimeLinkHandlers): RealtimeLink {
    let closed = false;
    let opened = false;
    let fallback: RealtimeLink | undefined;
    const socket = new WebSocket(realtimeUrl(target, "ws"));
    socket.addEventListener("open", () => {
      opened = true;
      if (!closed) handlers.onOpen();
    });
    socket.addEventListener("message", (event: MessageEvent) => {
      const message = typeof event.data === "string" ? decodeMessage(event.data) : undefined;
      if (!closed && message !== undefined) handlers.onMessage(message);
    });
    socket.addEventListener("close", () => {
      if (closed || fallback !== undefined) return;
      if (!opened) {
        fallback = this.stream(target, handlers);
        return;
      }
      closed = true;
      handlers.onClose();
    });
    return {
      close: () => {
        closed = true;
        fallback?.close();
        socket.close();
      },
    };
  }

  /** Opens the server-sent-events link to `target`. */
  private stream(target: RealtimeTarget, handlers: RealtimeLinkHandlers): RealtimeLink {
    const abort = new AbortController();
    let closed = false;
    const run = async (): Promise<void> => {
      try {
        const response = await fetch(realtimeUrl(target, "http"), {
          headers: { accept: "text/event-stream" },
          signal: abort.signal,
        });
        if (!response.ok || closed) return;
        handlers.onOpen();
        for await (const event of readServerSentEvents(response)) {
          if (closed) return;
          const message = event.event === "refresh" ? decodeMessage(event.data) : undefined;
          if (message !== undefined) handlers.onMessage(message);
        }
      } catch {
        // A refused, aborted or broken stream ends the link below.
      }
    };
    void run().finally(() => {
      if (closed) return;
      closed = true;
      handlers.onClose();
    });
    return {
      close: () => {
        closed = true;
        abort.abort();
      },
    };
  }
}
