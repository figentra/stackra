/**
 * Stackra file contract:
 * Purpose: unit tests of `RoomTokenAction` and the room host it completes: the action refuses an unknown or invisible
 *          document, a caller who may not view it and a scope without live collaboration, sets `mayEdit` from the edit
 *          permission, and issues a token that is single-use, expires, and is bound to its document and its user; a
 *          permission revoked mid-session drops the member's next edit. End to end, two sessions over the realtime
 *          drivers, the action and `RealtimeRooms` see each other's cursor, an edit reaches the other replica, a
 *          snapshot restores, and a revoked edit right stops the next edit.
 * Boundary: test only; `Database.current()` hands out an in-memory entity manager, access control is the memory
 *           driver, entitlements are faked, and the browser `WebSocket` is a stand-in wired to `RealtimeRooms.accept`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0346 (decisions 3 to 6); ADR 0270 (decision 5).
 */
import { fakeActionContext, MemoryAccessControlDriver } from "@stackra/actions/testing";
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { type Actor, ActorKind, Duration, type PublicId, Realm } from "@stackra/contracts";
import { Database } from "@stackra/database";
import type { EntitlementSource } from "@stackra/entitlements";
import { fakeEntitlements } from "@stackra/entitlements/testing";
import { EntitlementRequiredError, ForbiddenError, NotFoundError } from "@stackra/errors";
import { HasPublicId, Model } from "@stackra/model";
import {
  LocalRealtimeFanoutDriver,
  MemoryRealtimeTokenLedgerDriver,
  RealtimeConfig,
  RealtimeRooms,
  type RoomSocket,
} from "@stackra/realtime";
import type { RealtimeTarget, RoomFrame } from "@stackra/realtime/contracts";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CollaborationConfig } from "#config/collaboration.config";
import { RoomTokens } from "#contracts/ports/room-tokens.port";
import type { CollaborationRoom } from "#contracts/types/collaboration-room.type";
import type { DocumentReplica } from "#contracts/types/document-replica.type";
import { LiveCollaborationEntitlement } from "#core/access/live-collaboration.entitlement";
import { RealtimePresenceChannelDriver } from "#core/drivers/realtime-presence-channel.driver";
import { RealtimeSyncTransportDriver } from "#core/drivers/realtime-sync-transport.driver";
import { CollaborationSession } from "#core/services/collaboration-session.service";
import { SnapshotService } from "#core/services/snapshot.service";
import { RoomTokenAction } from "#node/actions/room-token.action";
import { Collaborative } from "#node/decorators/collaborative.decorator";
import { RoomTokenInput } from "#node/schemas/room-token-input.schema";
import { MemorySnapshotStoreDriver } from "#testing/drivers/memory-snapshot-store.driver";

const VIEW = "studio.template.read";
const EDIT = "studio.template.update";

@Collaborative({
  view: VIEW,
  edit: EDIT,
})
class Template extends Model.with(HasPublicId("tpl")) {}

const SCOPE = "scp_01j9z3k4m5n6p7q8r9s0t1v2w1" as PublicId<"scp">;
const DOC = "tpl_01j9z3k4m5n6p7q8r9s0t1v2w3";
const OTHER = "tpl_01j9z3k4m5n6p7q8r9s0t1v2w4";
const ROOM: CollaborationRoom = { document: DOC, scope: { id: SCOPE, path: "platform.acme" } };
const ORIGIN = "https://api.example.test";

/** A staff user of the tenant. */
const user = (id: string): Actor =>
  ({ kind: ActorKind.User, id, realm: Realm.Staff, scopeId: SCOPE }) as unknown as Actor;
const ALICE = user("usr_01j9z3k4m5n6p7q8r9s0t1v2wa");
const BOB = user("usr_01j9z3k4m5n6p7q8r9s0t1v2wb");

/** Lets every pending microtask, promise and zero timer settle. */
const settle = async (): Promise<void> => {
  for (let round = 0; round < 10; round += 1)
    // oxlint-disable-next-line no-await-in-loop -- reason: each round lets the previous one's callbacks run
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
};

/** A recording room peer. */
function peer() {
  const frames: RoomFrame[] = [];
  return {
    frames,
    deliver: (frame: RoomFrame) => {
      frames.push(frame);
    },
    close: () => undefined,
  };
}

/** The room host of one service instance, with only `DOC` stored (and invisible `OTHER` rows stay absent). */
function host(
  entitlements: EntitlementSource = fakeEntitlements([[LiveCollaborationEntitlement, true]]),
) {
  const rows = new Map<string, object>([[DOC, Object.assign(new Template(), { id: DOC })]]);
  const em = {
    findOneOrFail: vi.fn(
      async (_model: unknown, where: { id: string }, options: { failHandler: () => Error }) => {
        const row = rows.get(where.id);
        if (row === undefined) throw options.failHandler();
        return row;
      },
    ),
  };
  vi.spyOn(Database, "current").mockReturnValue({
    em: () => em as unknown as ReturnType<Database["em"]>,
  } as unknown as Database);
  const realtime = buildConfig(RealtimeConfig, { values: { origin: ORIGIN } });
  const rooms = new RealtimeRooms(
    realtime,
    new LocalRealtimeFanoutDriver(),
    new MemoryRealtimeTokenLedgerDriver(),
  );
  const access = new MemoryAccessControlDriver();
  const action = new RoomTokenAction(rooms, realtime, access, entitlements);
  const issue = (as: Actor, document = DOC): Promise<RealtimeTarget> =>
    action.handle(
      RoomTokenInput.create({ document }),
      fakeActionContext({ actor: as, scopeId: SCOPE }),
    );
  return { rooms, access, action, issue, realtime, rows };
}

beforeEach(() => {
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe(RoomTokenAction, () => {
  it("is the room.token action for users and not a tool", () => {
    expect(kindOf(RoomTokenAction)?.options).toMatchObject({
      key: "room.token",
      actors: [ActorKind.User],
      tool: false,
    });
  });

  it("refuses an unknown model, an unknown or invisible document, a forbidden viewer and an unentitled scope", async () => {
    const { issue, access } = host();
    await expect(issue(ALICE, "zzz_01j9z3k4m5n6p7q8r9s0t1v2w3")).rejects.toThrow(NotFoundError);
    await expect(issue(ALICE, OTHER)).rejects.toThrow(NotFoundError);
    access.deny(VIEW);
    await expect(issue(ALICE)).rejects.toThrow(ForbiddenError);
    const { issue: unentitled } = host(fakeEntitlements());
    await expect(unentitled(ALICE)).rejects.toThrow(EntitlementRequiredError);
  });

  it("answers the realtime origin and a token that joins its document's room once, as its user", async () => {
    const { issue, rooms } = host();
    const target = await issue(ALICE);
    expect(target.origin).toBe(ORIGIN);
    const a = peer();
    const member = await rooms.join(target.token, a);
    expect(member?.self.principalId).toBe(ALICE.id);
    expect(rooms.size(`${SCOPE}:${DOC}`)).toBe(1);
    expect(rooms.size(`${SCOPE}:${OTHER}`)).toBe(0);
    await expect(rooms.join(target.token, peer())).resolves.toBeUndefined();
    const key = (a.frames[0] as { key: string }).key;
    await expect(rooms.publishFrom(key, BOB.id, { t: "presence", data: {} })).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("lets a token expire unused", async () => {
    vi.useFakeTimers();
    const { issue, rooms, realtime } = host();
    const { token } = await issue(ALICE);
    vi.advanceTimersByTime(Duration.toMilliseconds(realtime.subscribeTokenTtl) + 1);
    await expect(rooms.join(token, peer())).resolves.toBeUndefined();
  });

  it("sets mayEdit from the edit permission and drops the next edit once it is revoked", async () => {
    const { issue, rooms, access } = host();
    access.deny(EDIT);
    const viewer = await rooms.join((await issue(BOB)).token, peer());
    expect(() => viewer?.publish({ t: "update", data: "AAE=" })).toThrow(ForbiddenError);
    access.allow(EDIT);
    const editor = await rooms.join((await issue(ALICE)).token, peer());
    const b = peer();
    await rooms.join((await issue(BOB)).token, b);
    await editor?.publish({ t: "update", data: "AAE=" });
    expect(b.frames.at(-1)).toMatchObject({ t: "update", data: "AAE=" });
    access.deny(EDIT);
    await expect(editor?.publish({ t: "update", data: "AgM=" })).rejects.toThrow(ForbiddenError);
    expect(b.frames.filter((frame) => frame.t === "update")).toHaveLength(1);
  });
});

/** A grow-only set of numbers: the smallest CRDT, standing in for a Yjs document. */
class SetReplica implements DocumentReplica {
  readonly items = new Set<number>();

  private readonly listeners = new Set<(update: Uint8Array) => void>();

  /** A local change. */
  add(item: number): void {
    this.items.add(item);
    for (const listener of this.listeners) listener(Uint8Array.of(item));
  }

  apply(update: Uint8Array): void {
    for (const item of update) this.items.add(item);
  }

  encode(): Uint8Array {
    return Uint8Array.from(this.items);
  }

  onUpdate(listener: (update: Uint8Array) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

/** The room host the bridged sockets reach. */
let HUB: RealtimeRooms | undefined;

/** A browser `WebSocket` stand-in whose other end is `RealtimeRooms.accept`, as the room endpoint would wire it. */
class BridgedSocket {
  readonly refused: unknown[] = [];

  readyState = 0;

  private readonly listeners = new Map<string, ((event: { data?: unknown }) => void)[]>();

  private readonly server = new Map<string, (event: { readonly data: unknown }) => void>();

  constructor(url: string) {
    queueMicrotask(() => {
      this.readyState = 1;
      this.emit("open", {});
      const socket: RoomSocket = {
        // Each leg is asynchronous, as on a network: a frame never arrives inside the send that made it.
        send: (data) => {
          if (data.includes('"refused"')) this.refused.push(JSON.parse(data));
          queueMicrotask(() => this.emit("message", { data }));
        },
        close: () => this.close(),
        addEventListener: ((
          type: string,
          listener: (event: { readonly data: unknown }) => void,
        ) => {
          this.server.set(type, listener);
        }) as RoomSocket["addEventListener"],
      };
      void HUB?.accept(socket, url);
    });
  }

  addEventListener(type: string, listener: (event: { data?: unknown }) => void): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  send(data: string): void {
    queueMicrotask(() => this.server.get("message")?.({ data }));
  }

  close(): void {
    if (this.readyState === 3) return;
    this.readyState = 3;
    this.server.get("close")?.({ data: undefined });
    this.emit("close", {});
  }

  private emit(type: string, event: { data?: unknown }): void {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}

describe("the room host end to end", () => {
  it("shows cursors, relays edits, restores a snapshot and drops an edit after revocation", async () => {
    const opened: BridgedSocket[] = [];
    vi.stubGlobal(
      "WebSocket",
      class extends BridgedSocket {
        constructor(url: string) {
          super(url);
          opened.push(this);
        }
      },
    );
    const { issue, rooms, access, realtime } = host();
    HUB = rooms;
    const config = buildConfig(CollaborationConfig);
    const entitlements = fakeEntitlements([[LiveCollaborationEntitlement, true]]);
    /** Tokens through the action, as the client driver gets them from the hosting service. */
    const tokensFor = (as: Actor): RoomTokens =>
      new (class extends RoomTokens {
        issue(): Promise<RealtimeTarget> {
          return issue(as);
        }
      })();
    const session = (as: Actor): CollaborationSession => {
      const tokens = tokensFor(as);
      return new CollaborationSession(
        config,
        new RealtimePresenceChannelDriver(tokens, config, realtime),
        new RealtimeSyncTransportDriver(tokens, realtime),
        entitlements,
      );
    };
    const alice = session(ALICE);
    const bob = session(BOB);
    const aliceDoc = new SetReplica();
    const bobDoc = new SetReplica();
    const releases = [
      alice.join(ROOM),
      bob.join(ROOM),
      alice.bind(ROOM, aliceDoc),
      bob.bind(ROOM, bobDoc),
    ];
    await settle();

    expect(bob.state(ROOM)?.peers.map((each) => each.principalId)).toEqual([ALICE.id]);
    alice.moveCursor(ROOM, { x: 4, y: 2 });
    await settle();
    expect(bob.state(ROOM)?.peers[0]?.cursor).toEqual({ x: 4, y: 2 });

    aliceDoc.add(7);
    await settle();
    expect([...bobDoc.items]).toContain(7);

    const snapshots = new SnapshotService(config, new MemorySnapshotStoreDriver());
    await snapshots.save(ROOM, aliceDoc);
    const restored = new SetReplica();
    expect(await snapshots.restore(ROOM, restored)).toBe(true);
    expect([...restored.items]).toContain(7);

    access.deny(EDIT);
    aliceDoc.add(8);
    await settle();
    expect([...bobDoc.items]).not.toContain(8);
    expect(opened.flatMap((socket) => socket.refused)).toContainEqual({
      t: "refused",
      code: "forbidden",
    });

    for (const release of releases) release();
    HUB = undefined;
  });
});
