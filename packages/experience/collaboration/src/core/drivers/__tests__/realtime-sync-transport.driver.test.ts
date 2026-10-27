/**
 * Stackra file contract:
 * Purpose: unit tests of `RealtimeSyncTransportDriver`: it is the `SyncTransport` port; the room's welcome opens the
 *          stream, a sent update leaves as a base64 `update` message, a peer's update arrives as bytes, other frames
 *          and malformed updates are ignored, and a drop reports `onClose`.
 * Boundary: test only; `WebSocket` is a fake and timers are faked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0346 (decisions 4 and 5).
 */
import { buildConfig } from "@stackra/config";
import { RealtimeConfig } from "@stackra/realtime";
import type { RealtimeTarget } from "@stackra/realtime/contracts";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RoomTokens } from "#contracts/ports/room-tokens.port";
import { SyncTransport } from "#contracts/ports/sync-transport.port";
import { RealtimeSyncTransportDriver } from "#core/drivers/realtime-sync-transport.driver";
import { FakeWebSocket } from "#core/functions/__tests__/fake-web-socket";

class Tokens extends RoomTokens {
  async issue(): Promise<RealtimeTarget> {
    return { origin: "https://api.example.test", token: "t1" };
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  FakeWebSocket.opened.length = 0;
  vi.stubGlobal("WebSocket", FakeWebSocket);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe(RealtimeSyncTransportDriver, () => {
  it("streams updates through the room", async () => {
    const transport = new RealtimeSyncTransportDriver(new Tokens(), buildConfig(RealtimeConfig));
    expect(transport).toBeInstanceOf(SyncTransport);
    const events: unknown[] = [];
    const link = transport.open(
      { document: "pag_1" },
      {
        onOpen: () => events.push("open"),
        onUpdate: (update) => events.push([...update]),
        onClose: () => events.push("close"),
      },
    );
    await vi.advanceTimersByTimeAsync(0);
    const socket = FakeWebSocket.opened[0];
    socket?.receive({ t: "welcome", self: { peerId: "p1", principalId: "usr_a" }, key: "k1" });
    link.send(new Uint8Array([0, 1]));
    expect(socket?.sent).toEqual([{ t: "update", data: "AAE=" }]);
    const from = { peerId: "p2", principalId: "usr_b" };
    socket?.receive({ t: "update", from, data: "AgM=" });
    socket?.receive({ t: "update", from, data: 7 });
    socket?.receive({ t: "presence", from, data: {} });
    socket?.close();
    expect(events).toEqual(["open", [2, 3], "close"]);
    link.close();
  });
});
