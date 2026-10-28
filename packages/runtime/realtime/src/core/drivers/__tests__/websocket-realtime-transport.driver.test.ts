/**
 * Stackra file contract:
 * Purpose: unit tests of the `websocket` `RealtimeTransport`: a driver of the port that opens a socket on the
 *          realtime URL, reports open, decoded messages and a far-side close, drops malformed frames, reports nothing
 *          on a caller's close, and falls back to the event stream (same token, `refresh` events only) when the socket
 *          closes unopened, reporting `onClose` when the stream ends or is refused.
 * Boundary: test only; the global `WebSocket` and `fetch` are stubbed with small stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0225 (decision 1: WebSocket with an SSE fallback).
 */
import { kindOf } from "@stackra/container";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RealtimeTransport } from "#contracts/ports/realtime-transport.port";
import { WebsocketRealtimeTransportDriver } from "#core/drivers/websocket-realtime-transport.driver";

const TARGET = { origin: "https://api.acme.example", token: "t1" };

const PAID = { channel: "tenant.ten_1.orders", name: "orders.order.paid.v1", id: "evt_1" };

/** A stand-in socket the test drives from the server side. */
class FakeSocket extends EventTarget {
  static readonly opened: FakeSocket[] = [];

  readonly url: string;

  closed = false;

  constructor(url: string) {
    super();
    this.url = url;
    FakeSocket.opened.push(this);
  }

  close(): void {
    this.closed = true;
  }

  /** The server accepted the upgrade. */
  accept(): void {
    this.dispatchEvent(new Event("open"));
  }

  /** The server sent `data`. */
  receive(data: unknown): void {
    this.dispatchEvent(new MessageEvent("message", { data }));
  }

  /** The socket went down. */
  lose(): void {
    this.dispatchEvent(new Event("close"));
  }
}

/** Handlers that record their calls. */
const handlers = () => ({ onOpen: vi.fn(), onMessage: vi.fn(), onClose: vi.fn() });

/** Lets queued promise callbacks run: a macrotask, as a stream read takes more microtask hops than a fixed count. */
async function settle(): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/** An event-stream response whose body a test writes. */
function streamResponse() {
  let controller: ReadableStreamDefaultController<Uint8Array> | undefined;
  const body = new ReadableStream<Uint8Array>({ start: (c) => (controller = c) });
  const encoder = new TextEncoder();
  return {
    response: new Response(body, { headers: { "content-type": "text/event-stream" } }),
    write: (text: string) => controller?.enqueue(encoder.encode(text)),
    end: () => controller?.close(),
  };
}

beforeEach(() => {
  FakeSocket.opened.length = 0;
  vi.stubGlobal("WebSocket", FakeSocket);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WebsocketRealtimeTransportDriver", () => {
  it("is a driver of RealtimeTransport", () => {
    expect(new WebsocketRealtimeTransportDriver()).toBeInstanceOf(RealtimeTransport);
    expect(kindOf(WebsocketRealtimeTransportDriver)).toEqual({
      kind: "driver",
      options: { port: RealtimeTransport },
    });
  });

  it("opens a socket and reports open, messages and a far-side close", () => {
    const reported = handlers();
    new WebsocketRealtimeTransportDriver().open(TARGET, reported);
    const [socket] = FakeSocket.opened;
    expect(socket?.url).toBe("wss://api.acme.example/realtime?token=t1");
    socket?.accept();
    socket?.receive(JSON.stringify(PAID));
    socket?.receive("not json");
    socket?.receive(new ArrayBuffer(4));
    socket?.lose();
    socket?.lose();
    expect(reported.onOpen).toHaveBeenCalledOnce();
    expect(reported.onMessage).toHaveBeenCalledExactlyOnceWith(PAID);
    expect(reported.onClose).toHaveBeenCalledOnce();
  });

  it("reports nothing after the caller closes", () => {
    const reported = handlers();
    const link = new WebsocketRealtimeTransportDriver().open(TARGET, reported);
    const [socket] = FakeSocket.opened;
    socket?.accept();
    link.close();
    socket?.receive(JSON.stringify(PAID));
    socket?.lose();
    expect(socket?.closed).toBe(true);
    expect(reported.onMessage).not.toHaveBeenCalled();
    expect(reported.onClose).not.toHaveBeenCalled();
  });

  it("falls back to the event stream when the socket closes unopened", async () => {
    const stream = streamResponse();
    const fetch = vi.fn(() => Promise.resolve(stream.response));
    vi.stubGlobal("fetch", fetch);
    const reported = handlers();
    new WebsocketRealtimeTransportDriver().open(TARGET, reported);
    FakeSocket.opened[0]?.lose();
    await settle();
    expect(fetch).toHaveBeenCalledWith(
      "https://api.acme.example/realtime?token=t1",
      expect.objectContaining({ headers: { accept: "text/event-stream" } }),
    );
    expect(reported.onOpen).toHaveBeenCalledOnce();
    stream.write(": open\n\n");
    stream.write(`event: ping\ndata: {}\n\n`);
    stream.write(`id: evt_1\nevent: refresh\ndata: ${JSON.stringify(PAID)}\n\n`);
    await settle();
    expect(reported.onMessage).toHaveBeenCalledExactlyOnceWith(PAID);
    expect(reported.onClose).not.toHaveBeenCalled();
    stream.end();
    await settle();
    expect(reported.onClose).toHaveBeenCalledOnce();
  });

  it("reports onClose when the fallback is refused", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(new Response(null, { status: 401 })));
    const reported = handlers();
    new WebsocketRealtimeTransportDriver().open(TARGET, reported);
    FakeSocket.opened[0]?.lose();
    await settle();
    expect(reported.onOpen).not.toHaveBeenCalled();
    expect(reported.onClose).toHaveBeenCalledOnce();
  });

  it("aborts the fallback stream when the caller closes", async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal("fetch", (_url: string, init: RequestInit) => {
      signal = init.signal ?? undefined;
      return new Promise<Response>(() => {});
    });
    const reported = handlers();
    const link = new WebsocketRealtimeTransportDriver().open(TARGET, reported);
    FakeSocket.opened[0]?.lose();
    await settle();
    link.close();
    expect(signal?.aborted).toBe(true);
    expect(reported.onClose).not.toHaveBeenCalled();
  });
});
