/**
 * Stackra file contract:
 * Purpose: unit tests of `openRoom`: it fetches a token, opens the room socket on the token's origin with the token,
 *          reports the welcome and later frames (dropping malformed ones and anything before the welcome), sends only
 *          while open, reconnects after a drop and after a refused token, and stops on close; when the socket closes
 *          unopened it streams the room over server-sent events and sends through `RoomTokens.publish` with the key.
 * Boundary: test only; `WebSocket` and `fetch` are fakes and timers are faked. The cap was `maxBackoffSeconds`
 *           (30 and 1) before stackra-223 and is now `maxBackoff` (`Duration.seconds(30)` and `(1)`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0346 (decisions 1 and 5).
 */
import { Duration } from "@stackra/contracts";
import type { RealtimeTarget } from "@stackra/realtime/contracts";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RoomTokens } from "#contracts/ports/room-tokens.port";
import { openRoom } from "#core/functions/open-room.function";
import { FakeWebSocket } from "#core/functions/__tests__/fake-web-socket";

class Tokens extends RoomTokens {
  calls = 0;

  failures = 0;

  async issue(): Promise<RealtimeTarget> {
    this.calls += 1;
    if (this.failures > 0) {
      this.failures -= 1;
      throw new Error("refused");
    }
    return { origin: "https://api.example.test", token: `t${this.calls}` };
  }
}

const settle = async () => {
  await vi.advanceTimersByTimeAsync(0);
};

beforeEach(() => {
  vi.useFakeTimers();
  FakeWebSocket.opened.length = 0;
  FakeWebSocket.blocked = false;
  vi.stubGlobal("WebSocket", FakeWebSocket);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("openRoom", () => {
  it("connects with the token and reports the welcome and frames", async () => {
    const events: unknown[] = [];
    const link = openRoom(
      new Tokens(),
      { document: "pag_1" },
      {
        onWelcome: (self) => events.push(["welcome", self]),
        onFrame: (frame) => events.push(["frame", frame.t]),
        onDown: () => events.push(["down"]),
      },
      { maxBackoff: Duration.seconds(30) },
    );
    await settle();
    const socket = FakeWebSocket.opened[0];
    expect(socket?.url).toBe("wss://api.example.test/realtime/room?token=t1");
    socket?.receive({ t: "presence", from: { peerId: "x", principalId: "usr_x" }, data: {} });
    socket?.receive({ t: "welcome", self: { peerId: "p1", principalId: "usr_a" }, key: "k1" });
    socket?.receive("not json");
    socket?.receive({ t: "left", peer: { peerId: "x", principalId: "usr_x" } });
    link.send({ t: "presence", data: {} });
    expect(socket?.sent).toEqual([{ t: "presence", data: {} }]);
    expect(events).toEqual([
      ["welcome", { peerId: "p1", principalId: "usr_a" }],
      ["frame", "left"],
    ]);
    link.close();
    expect(events.at(-1)).toEqual(["down"]);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(FakeWebSocket.opened).toHaveLength(1);
  });

  it("reconnects after a drop and after a refused token", async () => {
    const tokens = new Tokens();
    tokens.failures = 1;
    openRoom(
      tokens,
      { document: "pag_1" },
      { onWelcome: () => undefined, onFrame: () => undefined, onDown: () => undefined },
      { maxBackoff: Duration.seconds(1) },
    );
    await settle();
    expect(FakeWebSocket.opened).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1000);
    expect(FakeWebSocket.opened).toHaveLength(1);
    FakeWebSocket.opened[0]?.close();
    await vi.advanceTimersByTimeAsync(1000);
    expect(FakeWebSocket.opened).toHaveLength(2);
    expect(FakeWebSocket.opened[1]?.url).toContain("token=t3");
  });

  it("streams the room over server-sent events when the socket cannot open", async () => {
    FakeWebSocket.blocked = true;
    const encoder = new TextEncoder();
    let push: ReadableStreamDefaultController<Uint8Array> | undefined;
    const fetched: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        fetched.push(url);
        return new Response(
          new ReadableStream<Uint8Array>({
            start: (controller) => {
              push = controller;
            },
          }),
          { headers: { "content-type": "text/event-stream" } },
        );
      }),
    );
    const tokens = new Tokens();
    const published: unknown[] = [];
    tokens.publish = async (room, key, message) => {
      published.push([room, key, message]);
    };
    const events: unknown[] = [];
    const link = openRoom(
      tokens,
      { document: "pag_1" },
      {
        onWelcome: (self) => events.push(["welcome", self.peerId]),
        onFrame: (frame) => events.push(["frame", frame.t]),
        onDown: () => events.push(["down"]),
      },
      { maxBackoff: Duration.seconds(30) },
    );
    await settle();
    await settle();
    expect(fetched).toEqual(["https://api.example.test/realtime/room?token=t2"]);
    const frame = (value: unknown) =>
      push?.enqueue(encoder.encode(`event: frame\ndata: ${JSON.stringify(value)}\n\n`));
    frame({ t: "welcome", self: { peerId: "p1", principalId: "usr_a" }, key: "k1" });
    frame({ t: "left", peer: { peerId: "x", principalId: "usr_x" } });
    await settle();
    link.send({ t: "presence", data: {} });
    expect(published).toEqual([[{ document: "pag_1" }, "k1", { t: "presence", data: {} }]]);
    expect(events).toEqual([
      ["welcome", "p1"],
      ["frame", "left"],
    ]);
    link.close();
    await settle();
    expect(FakeWebSocket.opened).toHaveLength(1);
  });
});
