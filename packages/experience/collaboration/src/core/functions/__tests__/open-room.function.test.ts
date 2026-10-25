/**
 * Stackra file contract:
 * Purpose: unit tests of `openRoom`: it fetches a token, opens the room socket on the token's origin with the token,
 *          reports the welcome and later frames (dropping malformed ones and anything before the welcome), sends only
 *          while open, reconnects after a drop and after a refused token, and stops on close.
 * Boundary: test only; `WebSocket` is a fake and timers are faked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0346 (decisions 1 and 5).
 */
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
      { maxBackoffSeconds: 30 },
    );
    await settle();
    const socket = FakeWebSocket.opened[0];
    expect(socket?.url).toBe("wss://api.example.test/realtime/room?token=t1");
    socket?.receive({ t: "presence", from: { peerId: "x", principalId: "usr_x" }, data: {} });
    socket?.receive({ t: "welcome", self: { peerId: "p1", principalId: "usr_a" } });
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
      { maxBackoffSeconds: 1 },
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
});
