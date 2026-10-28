/**
 * Stackra file contract:
 * Purpose: unit tests of `CollaborationSession`: a granted room connects and two principals see each other; a refused
 *          or wrongly granted room records its error and joins nothing; holds are counted and releases idempotent; a
 *          release before the grant joins nothing; cursor moves are throttled to the latest; a dropped link empties
 *          the peers and recovers; a bound replica streams both ways, converges after a reconnect and stays local in a
 *          refused room.
 * Boundary: test only; the ports are this package's memory drivers, the grant comes from `fakeEntitlements`, and the
 *           replica is a set of numbers (a trivial CRDT) so the core is tested without Yjs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0225 (decision 2); ADR 0270 (decisions 5 and 6).
 */
import { buildConfig } from "@stackra/config";
import type { PublicId } from "@stackra/contracts";
import type { EntitlementSource } from "@stackra/entitlements";
import { fakeEntitlements } from "@stackra/entitlements/testing";
import { EntitlementRequiredError } from "@stackra/errors";
import { RealtimeStatus } from "@stackra/realtime";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CollaborationConfig } from "#config/collaboration.config";
import type { CollaborationRoom } from "#contracts/types/collaboration-room.type";
import type { DocumentReplica } from "#contracts/types/document-replica.type";
import { LiveCollaborationEntitlement } from "#core/access/live-collaboration.entitlement";
import { CollaborationSession } from "#core/services/collaboration-session.service";
import { MemoryPresenceChannelDriver } from "#testing/drivers/memory-presence-channel.driver";
import { MemorySyncTransportDriver } from "#testing/drivers/memory-sync-transport.driver";

const ROOM: CollaborationRoom = {
  document: "pag_01j9z3k4m5n6p7q8r9s0t1v2w3",
  scope: { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3", path: "platform.acme" },
};

const ALICE: PublicId = "usr_01j9z3k4m5n6p7q8r9s0t1v2wa";
const BOB: PublicId = "usr_01j9z3k4m5n6p7q8r9s0t1v2wb";

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

/** Lets every pending microtask and promise settle. */
const settle = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

/** Two people on the same in-memory network, both granted unless `source` says otherwise. */
function network(
  source: EntitlementSource = fakeEntitlements([[LiveCollaborationEntitlement, true]]),
) {
  const config = buildConfig(CollaborationConfig);
  const alicePresence = MemoryPresenceChannelDriver.for(ALICE);
  const bobPresence = alicePresence.peer(BOB);
  const aliceSync = new MemorySyncTransportDriver();
  const bobSync = aliceSync.peer();
  return {
    alicePresence,
    aliceSync,
    bobSync,
    alice: new CollaborationSession(config, alicePresence, aliceSync, source),
    bob: new CollaborationSession(config, bobPresence, bobSync, source),
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("CollaborationSession", () => {
  it("connects a granted room and shows each principal the other", async () => {
    const { alice, bob } = network();
    expect(alice.state(ROOM)).toBeNull();
    alice.join(ROOM);
    expect(alice.state(ROOM)).toEqual({ status: RealtimeStatus.Connecting, peers: [] });
    bob.join(ROOM);
    await settle();
    expect(alice.state(ROOM)?.status).toBe(RealtimeStatus.Connected);
    expect(alice.state(ROOM)?.peers.map((peer) => peer.principalId)).toEqual([BOB]);
    expect(bob.state(ROOM)?.peers).toEqual([
      { peerId: expect.any(String), principalId: ALICE, cursor: null },
    ]);
    expect(Object.isFrozen(alice.state(ROOM))).toBe(true);
  });

  it("notifies subscribers and reads the grant for the room's scope", async () => {
    const asked: unknown[] = [];
    const source = fakeEntitlements([[LiveCollaborationEntitlement, true]]);
    const grant = source.grant.bind(source);
    source.grant = (entitlement, scope) => {
      asked.push(scope);
      return grant(entitlement, scope);
    };
    const { alice } = network(source);
    let calls = 0;
    const unsubscribe = alice.subscribe(() => (calls += 1));
    alice.join(ROOM);
    await settle();
    expect(asked).toEqual([ROOM.scope?.id]);
    expect(calls).toBeGreaterThanOrEqual(2);
    unsubscribe();
  });

  it("records a refused room and joins nothing", async () => {
    const { alice, bob } = network(fakeEntitlements());
    bob.join(ROOM);
    alice.join(ROOM);
    await settle();
    const state = alice.state(ROOM);
    expect(state?.status).toBe(RealtimeStatus.Disconnected);
    expect(state?.peers).toEqual([]);
    expect(state?.error).toBeInstanceOf(EntitlementRequiredError);
  });

  it("records a source that answers a count for the feature as a TypeError", async () => {
    const { alice } = network(fakeEntitlements([[LiveCollaborationEntitlement, 3]]));
    alice.join(ROOM);
    await settle();
    expect(alice.state(ROOM)?.error).toBeInstanceOf(TypeError);
  });

  it("counts holds and leaves with the last release", async () => {
    const { alice, bob } = network();
    const first = alice.join(ROOM);
    const second = alice.join(ROOM);
    bob.join(ROOM);
    await settle();
    first();
    first();
    await settle();
    expect(bob.state(ROOM)?.peers).toHaveLength(1);
    second();
    await settle();
    expect(alice.state(ROOM)).toBeNull();
    expect(bob.state(ROOM)?.peers).toEqual([]);
  });

  it("joins nothing when released before the grant is read", async () => {
    const { alice, bob } = network();
    bob.join(ROOM);
    alice.join(ROOM)();
    await settle();
    expect(alice.state(ROOM)).toBeNull();
    expect(bob.state(ROOM)?.peers).toEqual([]);
  });

  it("sends the first cursor move now and the latest one after the interval", async () => {
    const { alice, bob } = network();
    alice.join(ROOM);
    bob.join(ROOM);
    await settle();
    vi.useFakeTimers();
    alice.moveCursor(ROOM, { x: 1, y: 1 });
    alice.moveCursor(ROOM, { x: 2, y: 2 });
    alice.moveCursor(ROOM, { x: 3, y: 3 });
    expect(bob.state(ROOM)?.peers[0]?.cursor).toEqual({ x: 1, y: 1 });
    vi.advanceTimersByTime(50);
    expect(bob.state(ROOM)?.peers[0]?.cursor).toEqual({ x: 3, y: 3 });
    alice.moveCursor(ROOM, null);
    vi.advanceTimersByTime(50);
    expect(bob.state(ROOM)?.peers[0]?.cursor).toBeNull();
  });

  it("empties the peers while the link is down and recovers on reconnect", async () => {
    const { alice, bob, alicePresence } = network();
    alice.join(ROOM);
    bob.join(ROOM);
    await settle();
    alicePresence.drop();
    expect(alice.state(ROOM)).toEqual({ status: RealtimeStatus.Disconnected, peers: [] });
    expect(bob.state(ROOM)?.peers).toEqual([]);
    alicePresence.reconnect();
    expect(alice.state(ROOM)?.status).toBe(RealtimeStatus.Connected);
    expect(alice.state(ROOM)?.peers.map((peer) => peer.principalId)).toEqual([BOB]);
  });

  it("streams a bound replica both ways and converges after a reconnect", async () => {
    const { alice, bob, bobSync } = network();
    const left = new SetReplica();
    const right = new SetReplica();
    left.add(1);
    const unbindLeft = alice.bind(ROOM, left);
    bob.bind(ROOM, right);
    await settle();
    expect([...right.items]).toEqual([1]);
    right.add(2);
    expect([...left.items].sort()).toEqual([1, 2]);
    bobSync.drop();
    left.add(3);
    expect(right.items.has(3)).toBe(false);
    bobSync.reconnect();
    expect([...right.items].sort()).toEqual([1, 2, 3]);
    unbindLeft();
    unbindLeft();
    left.add(4);
    expect(right.items.has(4)).toBe(false);
    expect(alice.state(ROOM)).toBeNull();
  });

  it("leaves a replica local in a refused room", async () => {
    const { alice, bob } = network(fakeEntitlements());
    const left = new SetReplica();
    const right = new SetReplica();
    alice.bind(ROOM, left);
    bob.bind(ROOM, right);
    await settle();
    left.add(1);
    expect(right.items.size).toBe(0);
    expect(alice.state(ROOM)?.error).toBeInstanceOf(EntitlementRequiredError);
  });
});
