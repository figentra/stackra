/**
 * Stackra file contract:
 * Purpose: unit tests of `RealtimeRooms`: a one-time token joins its grant's room in the session's tenant and gets a
 *          stamped `welcome`; messages relay to the other members (never the sender, never another tenant's room) and
 *          to the fanout; a viewer's update is refused `forbidden`; a full room, an oversized or too-fast member is
 *          refused `room_limit_reached` and dropped; leaving announces `left`; frames from another instance are
 *          delivered and this instance's own are skipped; a socket is accepted or closed with the right code; members
 *          close at token expiry and idle; a member joins over an event stream (or gets 401, 426 or 429) and publishes
 *          by its key through `publishFrom`, here or on another instance; the member cap counts other instances'
 *          fresh counts unless `countAcrossInstances` is off.
 * Boundary: test only; the local fanout and recording peers stand in for the network; timers are faked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0346 (decisions 1 and 3 to 6).
 */
import { buildConfig } from "@stackra/config";
import { Duration, Realm } from "@stackra/contracts";
import { ForbiddenError } from "@stackra/errors";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RealtimeConfig } from "#config/realtime.config";
import type { FanoutMessage } from "#contracts/types/fanout-message.type";
import type { RoomFrame } from "#contracts/types/room-frame.type";
import type { RoomGrant } from "#contracts/types/room-grant.type";
import { LocalRealtimeFanoutDriver } from "#core/drivers/local-realtime-fanout.driver";
import { RoomLimitReachedError } from "#core/errors/room-limit-reached.error";
import { RealtimeRooms } from "#core/services/realtime-rooms.service";
import type { RoomSocket } from "#core/types/room-socket.type";

/** A grant for `principalId` in `scopeId` on page `pag_1`. */
function grant(principalId: string, mayEdit = true, scopeId = "ten_1"): RoomGrant {
  return {
    session: { principalId, scopeId, realm: Realm.Staff, permissions: [] },
    document: "pag_1",
    mayEdit,
  };
}

/** A peer that records frames and its close. */
function peer() {
  const frames: RoomFrame[] = [];
  const closes: [number, string][] = [];
  return {
    frames,
    closes,
    deliver: (frame: RoomFrame) => {
      frames.push(frame);
    },
    close: (code: number, reason: string) => {
      closes.push([code, reason]);
    },
  };
}

function roomsOf(rooms: Record<string, number | boolean> = {}) {
  const fanout = new LocalRealtimeFanoutDriver();
  const published: FanoutMessage[] = [];
  const publish = fanout.publish.bind(fanout);
  fanout.publish = (message) => {
    published.push(message);
    return publish(message);
  };
  return {
    rooms: new RealtimeRooms(
      buildConfig(RealtimeConfig, {
        values: {
          rooms: {
            maxMembers: 2,
            maxMessageBytes: 64,
            maxMessagesPerSecond: 3,
            idleCloseSeconds: 60,
            ...rooms,
          },
        },
      }),
      fanout,
    ),
    published,
  };
}

/** The room path's URL with `token`. */
function roomUrl(token: string): string {
  return `http://api.test/realtime/room?token=${token}`;
}

/** The publish key of the welcome in `frames`. */
function keyOf(frames: readonly RoomFrame[]): string {
  return (frames[0] as { readonly key: string }).key;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe(RealtimeRooms, () => {
  it("joins once per token, welcomes with a stamped identity, and relays to the others", () => {
    const { rooms, published } = roomsOf();
    const token = rooms.issueToken(grant("usr_a")).token;
    const a = peer();
    const alice = rooms.join(token, a);
    expect(rooms.join(token, peer())).toBeUndefined();
    const b = peer();
    const bob = rooms.join(rooms.issueToken(grant("usr_b")).token, b);
    expect(a.frames[0]).toEqual({ t: "welcome", self: alice?.self, key: expect.any(String) });
    expect(alice?.self.principalId).toBe("usr_a");
    expect(rooms.size("ten_1:pag_1")).toBe(2);
    alice?.publish({ t: "update", data: "AAE=" });
    expect(b.frames.at(-1)).toEqual({ t: "update", from: alice?.self, data: "AAE=" });
    expect(a.frames.filter((frame) => frame.t === "update")).toEqual([]);
    expect(published.at(-1)).toMatchObject({
      kind: "room",
      room: "ten_1:pag_1",
      origin: rooms.instance,
    });
    bob?.leave();
    expect(a.frames.at(-1)).toEqual({ t: "left", peer: bob?.self });
  });

  it("keeps tenants apart", () => {
    const { rooms } = roomsOf();
    const a = peer();
    const other = peer();
    const alice = rooms.join(rooms.issueToken(grant("usr_a")).token, a);
    rooms.join(rooms.issueToken(grant("usr_x", true, "ten_2")).token, other);
    alice?.publish({ t: "presence", data: {} });
    expect(other.frames.map((frame) => frame.t)).toEqual(["welcome"]);
  });

  it("refuses a viewer's update and keeps it in the room", () => {
    const { rooms } = roomsOf();
    const viewer = rooms.join(rooms.issueToken(grant("usr_v", false)).token, peer());
    expect(() => viewer?.publish({ t: "update", data: "AAE=" })).toThrow(ForbiddenError);
    expect(() => viewer?.publish({ t: "awareness", data: { x: 1 } })).not.toThrow();
    expect(rooms.size("ten_1:pag_1")).toBe(1);
  });

  it("refuses a full room and drops a member over the size or rate cap", () => {
    const { rooms } = roomsOf();
    rooms.join(rooms.issueToken(grant("usr_a")).token, peer());
    const b = peer();
    const bob = rooms.join(rooms.issueToken(grant("usr_b")).token, b);
    expect(() => rooms.join(rooms.issueToken(grant("usr_c")).token, peer())).toThrow(
      RoomLimitReachedError,
    );
    expect(() => bob?.publish({ t: "update", data: "x".repeat(100) })).toThrow(
      RoomLimitReachedError,
    );
    expect(b.closes).toEqual([[4429, "room_limit_reached"]]);
    expect(rooms.size("ten_1:pag_1")).toBe(1);
    const c = peer();
    const carol = rooms.join(rooms.issueToken(grant("usr_c")).token, c);
    for (let n = 0; n < 3; n += 1) carol?.publish({ t: "presence", data: {} });
    expect(() => carol?.publish({ t: "presence", data: {} })).toThrow(RoomLimitReachedError);
    expect(c.closes).toEqual([[4429, "room_limit_reached"]]);
  });

  it("delivers another instance's frames and skips its own", () => {
    const { rooms } = roomsOf();
    const a = peer();
    rooms.join(rooms.issueToken(grant("usr_a")).token, a);
    const frame: RoomFrame = {
      t: "presence",
      from: { peerId: "p9", principalId: "usr_9" },
      data: {},
    };
    rooms.receive({ kind: "room", room: "ten_1:pag_1", frame, origin: "another" });
    rooms.receive({ kind: "room", room: "ten_1:pag_1", frame, origin: rooms.instance });
    expect(a.frames.filter((each) => each.t === "presence")).toHaveLength(1);
  });

  it("closes a member at token expiry and after idling", () => {
    const { rooms } = roomsOf({ idleCloseSeconds: 5 });
    const a = peer();
    rooms.join(rooms.issueToken(grant("usr_a")).token, a);
    vi.advanceTimersByTime(5000);
    expect(a.closes).toEqual([[4408, "idle"]]);
    const b = peer();
    const { rooms: other } = roomsOf({ idleCloseSeconds: 3600 });
    other.join(other.issueToken(grant("usr_b")).token, b);
    vi.advanceTimersByTime(Duration.toMilliseconds(Duration.minutes(15)));
    expect(b.closes).toEqual([[4001, "token_expired"]]);
  });

  it("accepts a socket, relays its frames and answers a viewer's update", () => {
    const { rooms } = roomsOf();
    // The `close` listener takes no event, so it ignores the one it is called with.
    const listeners: Record<string, (event: { readonly data: unknown }) => void> = {};
    const sent: string[] = [];
    const closed: unknown[][] = [];
    const socket: RoomSocket = {
      send: (data) => {
        sent.push(data);
      },
      close: (...args) => {
        closed.push(args);
      },
      addEventListener: (type: string, listener: (event: { readonly data: unknown }) => void) => {
        listeners[type] = listener;
      },
    };
    expect(rooms.accept(socket, "/realtime/room?token=nope")).toBe(false);
    expect(closed).toEqual([[4401, "unauthorised"]]);
    const token = rooms.issueToken(grant("usr_v", false)).token;
    expect(rooms.accept(socket, `/realtime/room?token=${token}`)).toBe(true);
    listeners["message"]?.({ data: JSON.stringify({ t: "update", data: "AAE=" }) });
    listeners["message"]?.({ data: "not json" });
    expect(JSON.parse(sent.at(-1) ?? "{}")).toEqual({ t: "refused", code: "forbidden" });
    listeners["close"]?.({ data: undefined });
    expect(rooms.size("ten_1:pag_1")).toBe(0);
  });

  it("serves a member over an event stream and refuses a bad, upgraded or full join", async () => {
    const { rooms } = roomsOf({ maxMembers: 1 });
    expect(rooms.stream(new Request(roomUrl("nope"))).status).toBe(401);
    const unused = rooms.issueToken(grant("usr_a")).token;
    const upgrade = new Request(roomUrl(unused), { headers: { upgrade: "websocket" } });
    expect(rooms.stream(upgrade).status).toBe(426);
    const response = rooms.stream(new Request(roomUrl(unused)));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    const reader = response.body?.getReader();
    const first = new TextDecoder().decode((await reader?.read())?.value);
    expect(first).toMatch(/^event: frame\ndata: \{"t":"welcome"/);
    expect(rooms.size("ten_1:pag_1")).toBe(1);
    expect(rooms.stream(new Request(roomUrl(rooms.issueToken(grant("usr_b")).token))).status).toBe(
      429,
    );
    await reader?.cancel();
    expect(rooms.size("ten_1:pag_1")).toBe(0);
  });

  it("publishes for a member by its key, only as its principal", async () => {
    const { rooms, published } = roomsOf();
    const a = peer();
    rooms.join(rooms.issueToken(grant("usr_a")).token, a);
    const b = peer();
    rooms.join(rooms.issueToken(grant("usr_b", false)).token, b);
    await rooms.publishFrom(keyOf(b.frames), "usr_b", { t: "presence", data: { on: true } });
    expect(a.frames.at(-1)).toMatchObject({ t: "presence", data: { on: true } });
    await expect(
      rooms.publishFrom(keyOf(b.frames), "usr_a", { t: "presence", data: {} }),
    ).rejects.toThrow(ForbiddenError);
    await expect(
      rooms.publishFrom(keyOf(b.frames), "usr_b", { t: "update", data: "AAE=" }),
    ).rejects.toThrow(ForbiddenError);
    await rooms.publishFrom("elsewhere", "usr_z", { t: "presence", data: {} });
    expect(published.at(-1)).toEqual({
      kind: "room-publish",
      key: "elsewhere",
      principalId: "usr_z",
      message: { t: "presence", data: {} },
    });
  });

  it("takes a publish another instance received and answers a refusal on the member's own link", () => {
    const { rooms } = roomsOf();
    const a = peer();
    rooms.join(rooms.issueToken(grant("usr_a")).token, a);
    const v = peer();
    rooms.join(rooms.issueToken(grant("usr_v", false)).token, v);
    const key = keyOf(v.frames);
    rooms.receive({
      kind: "room-publish",
      key,
      principalId: "usr_v",
      message: { t: "awareness", data: 1 },
    });
    expect(a.frames.at(-1)).toMatchObject({ t: "awareness", data: 1 });
    rooms.receive({
      kind: "room-publish",
      key,
      principalId: "usr_v",
      message: { t: "update", data: "x" },
    });
    expect(v.frames.at(-1)).toEqual({ t: "refused", code: "forbidden" });
    rooms.receive({
      kind: "room-publish",
      key,
      principalId: "usr_x",
      message: { t: "awareness", data: 2 },
    });
    expect(a.frames.at(-1)).toMatchObject({ data: 1 });
  });

  it("counts other instances' fresh members toward the cap", () => {
    const { rooms } = roomsOf({ idleCloseSeconds: 5 });
    rooms.receive({ kind: "room-members", room: "ten_1:pag_1", origin: "another", members: 1 });
    rooms.join(rooms.issueToken(grant("usr_a")).token, peer());
    expect(() => rooms.join(rooms.issueToken(grant("usr_b")).token, peer())).toThrow(
      RoomLimitReachedError,
    );
    vi.advanceTimersByTime(4000);
    rooms.receive({
      kind: "room",
      room: "ten_1:pag_1",
      frame: { t: "left", peer: { peerId: "p9", principalId: "usr_9" } },
      origin: "another",
      members: 0,
    });
    expect(rooms.join(rooms.issueToken(grant("usr_b")).token, peer())).toBeDefined();
  });

  it("forgets a stale count, and counts this instance alone when told to", () => {
    const { rooms } = roomsOf({ idleCloseSeconds: 5 });
    rooms.receive({ kind: "room-members", room: "ten_1:pag_1", origin: "another", members: 2 });
    expect(() => rooms.join(rooms.issueToken(grant("usr_a")).token, peer())).toThrow(
      RoomLimitReachedError,
    );
    vi.advanceTimersByTime(10_001);
    expect(rooms.join(rooms.issueToken(grant("usr_a")).token, peer())).toBeDefined();
    const { rooms: alone } = roomsOf({ countAcrossInstances: false });
    alone.receive({ kind: "room-members", room: "ten_1:pag_1", origin: "another", members: 2 });
    expect(alone.join(alone.issueToken(grant("usr_a")).token, peer())).toBeDefined();
  });
});
