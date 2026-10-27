/**
 * Stackra file contract:
 * Purpose: unit tests of `RealtimePresenceChannelDriver`: it is the `PresenceChannel` port; on welcome it opens,
 *          announces presence and starts the heartbeat; a newcomer's presence is answered once; awareness sets a peer's
 *          cursor and `left` removes it; cursor moves are throttled to the interval; a drop clears the peers and
 *          reports `onClose`; leave stops everything.
 * Boundary: test only; `WebSocket` is a fake and timers are faked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0346 (decisions 4 to 6); ADR 0225 (decision 2).
 */
import { buildConfig } from "@stackra/config";
import { RealtimeConfig } from "@stackra/realtime";
import type { RealtimeTarget } from "@stackra/realtime/contracts";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CollaborationConfig } from "#config/collaboration.config";
import { PresenceChannel } from "#contracts/ports/presence-channel.port";
import { RoomTokens } from "#contracts/ports/room-tokens.port";
import type { PresencePeer } from "#contracts/types/presence-peer.type";
import { RealtimePresenceChannelDriver } from "#core/drivers/realtime-presence-channel.driver";
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

describe(RealtimePresenceChannelDriver, () => {
  it("tracks peers and throttles cursors", async () => {
    const channel = new RealtimePresenceChannelDriver(
      new Tokens(),
      buildConfig(CollaborationConfig, {
        values: { cursorIntervalMilliseconds: 100, presenceHeartbeatSeconds: 10 },
      }),
      buildConfig(RealtimeConfig),
    );
    expect(channel).toBeInstanceOf(PresenceChannel);
    const lists: (readonly PresencePeer[])[] = [];
    const states: string[] = [];
    const link = channel.join(
      { document: "pag_1" },
      {
        onOpen: () => states.push("open"),
        onPeers: (peers) => lists.push(peers),
        onClose: () => states.push("close"),
      },
    );
    await vi.advanceTimersByTimeAsync(0);
    const socket = FakeWebSocket.opened[0];
    socket?.receive({ t: "welcome", self: { peerId: "p1", principalId: "usr_a" }, key: "k1" });
    expect(states).toEqual(["open"]);
    expect(socket?.sent).toEqual([{ t: "presence", data: {} }]);
    const bob = { peerId: "p2", principalId: "usr_b" };
    socket?.receive({ t: "presence", from: bob, data: {} });
    socket?.receive({ t: "presence", from: bob, data: {} });
    expect(socket?.sent.filter((m) => (m as { t: string }).t === "presence")).toHaveLength(2);
    socket?.receive({ t: "awareness", from: bob, data: { cursor: { x: 3, y: 4 } } });
    expect(lists.at(-1)).toEqual([{ peerId: "p2", principalId: "usr_b", cursor: { x: 3, y: 4 } }]);
    link.move({ x: 1, y: 1 });
    link.move({ x: 2, y: 2 });
    await vi.advanceTimersByTimeAsync(100);
    const cursors = socket?.sent.filter((m) => (m as { t: string }).t === "awareness");
    expect(cursors).toEqual([
      { t: "awareness", data: { cursor: { x: 1, y: 1 } } },
      { t: "awareness", data: { cursor: { x: 2, y: 2 } } },
    ]);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(socket?.sent.filter((m) => (m as { t: string }).t === "presence")).toHaveLength(3);
    socket?.receive({ t: "left", peer: bob });
    expect(lists.at(-1)).toEqual([]);
    socket?.close();
    expect(states).toEqual(["open", "close"]);
    link.leave();
  });
});
