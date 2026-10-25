/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryPresenceChannelDriver`: a link opens on the next microtask; two principals see each
 *          other with their cursors; a link left before it opened never opens; leaving, dropping and reconnecting
 *          update the other peer's list; a move while down is ignored.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0225 (decision 2).
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { CollaborationRoom, PresenceLinkHandlers, PresencePeer } from "#contracts/index";
import { MemoryPresenceChannelDriver } from "#testing/drivers/memory-presence-channel.driver";

const ROOM: CollaborationRoom = { document: "pag_01j9z3k4m5n6p7q8r9s0t1v2w3" };
const ALICE: PublicId = "usr_01j9z3k4m5n6p7q8r9s0t1v2wa";
const BOB: PublicId = "usr_01j9z3k4m5n6p7q8r9s0t1v2wb";

/** Handlers that record what a link reports. */
function recorder() {
  const log = { opened: 0, closed: 0, peers: [] as readonly PresencePeer[] };
  const handlers: PresenceLinkHandlers = {
    onOpen: () => (log.opened += 1),
    onPeers: (peers) => (log.peers = peers),
    onClose: () => (log.closed += 1),
  };
  return { log, handlers };
}

describe("MemoryPresenceChannelDriver", () => {
  it("opens on the next microtask and shows two principals to each other", async () => {
    const alice = new MemoryPresenceChannelDriver(ALICE);
    const bob = alice.peer(BOB);
    const a = recorder();
    const b = recorder();
    const aliceLink = alice.join(ROOM, a.handlers);
    bob.join(ROOM, b.handlers);
    expect(a.log.opened).toBe(0);
    await Promise.resolve();
    expect([a.log.opened, b.log.opened]).toEqual([1, 1]);
    expect(b.log.peers).toEqual([{ peerId: expect.any(String), principalId: ALICE, cursor: null }]);
    aliceLink.move({ x: 3, y: 4 });
    expect(b.log.peers[0]?.cursor).toEqual({ x: 3, y: 4 });
    aliceLink.leave();
    aliceLink.leave();
    expect(b.log.peers).toEqual([]);
  });

  it("never opens a link left before it opened", async () => {
    const driver = new MemoryPresenceChannelDriver();
    const r = recorder();
    driver.join(ROOM, r.handlers).leave();
    await Promise.resolve();
    expect(r.log.opened).toBe(0);
  });

  it("drops and reconnects its own links only", async () => {
    const alice = new MemoryPresenceChannelDriver(ALICE);
    const bob = alice.peer(BOB);
    const a = recorder();
    const b = recorder();
    const aliceLink = alice.join(ROOM, a.handlers);
    bob.join(ROOM, b.handlers);
    await Promise.resolve();
    alice.drop();
    expect([a.log.closed, b.log.closed]).toEqual([1, 0]);
    expect(b.log.peers).toEqual([]);
    aliceLink.move({ x: 1, y: 1 });
    expect(b.log.peers).toEqual([]);
    alice.reconnect();
    expect(a.log.opened).toBe(2);
    expect(b.log.peers.map((peer) => peer.principalId)).toEqual([ALICE]);
  });
});
