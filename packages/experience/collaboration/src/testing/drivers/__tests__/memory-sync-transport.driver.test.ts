/**
 * Stackra file contract:
 * Purpose: unit tests of `MemorySyncTransportDriver`: a stream opens on the next microtask; updates reach the other
 *          open streams of the same document only; a late or reopened stream receives what the relay held; an update
 *          sent while down is dropped; a closed stream receives nothing.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0225 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import type { CollaborationRoom, SyncLinkHandlers } from "#contracts/index";
import { MemorySyncTransportDriver } from "#testing/drivers/memory-sync-transport.driver";

const ROOM: CollaborationRoom = { document: "pag_01j9z3k4m5n6p7q8r9s0t1v2w3" };
const OTHER: CollaborationRoom = { document: "pag_01j9z3k4m5n6p7q8r9s0t1v2w4" };

/** Handlers that record what a stream reports. */
function recorder() {
  const log = { opened: 0, closed: 0, updates: [] as number[] };
  const handlers: SyncLinkHandlers = {
    onOpen: () => (log.opened += 1),
    onUpdate: (update) => log.updates.push(...update),
    onClose: () => (log.closed += 1),
  };
  return { log, handlers };
}

describe("MemorySyncTransportDriver", () => {
  it("relays updates to the other open streams of the same document", async () => {
    const first = new MemorySyncTransportDriver();
    const second = first.peer();
    const a = recorder();
    const b = recorder();
    const c = recorder();
    const link = first.open(ROOM, a.handlers);
    second.open(ROOM, b.handlers);
    second.open(OTHER, c.handlers);
    expect(a.log.opened).toBe(0);
    await Promise.resolve();
    link.send(Uint8Array.of(1));
    expect(b.log.updates).toEqual([1]);
    expect(a.log.updates).toEqual([]);
    expect(c.log.updates).toEqual([]);
  });

  it("delivers what the relay held to a late stream and after a reconnect", async () => {
    const first = new MemorySyncTransportDriver();
    const second = first.peer();
    const a = recorder();
    const b = recorder();
    const link = first.open(ROOM, a.handlers);
    await Promise.resolve();
    link.send(Uint8Array.of(1));
    second.open(ROOM, b.handlers);
    await Promise.resolve();
    expect(b.log.updates).toEqual([1]);
    second.drop();
    expect(b.log.closed).toBe(1);
    link.send(Uint8Array.of(2));
    expect(b.log.updates).toEqual([1]);
    second.reconnect();
    expect(b.log.opened).toBe(2);
    expect(b.log.updates).toEqual([1, 1, 2]);
  });

  it("drops what a down stream sends and delivers nothing to a closed one", async () => {
    const first = new MemorySyncTransportDriver();
    const second = first.peer();
    const a = recorder();
    const b = recorder();
    const sender = first.open(ROOM, a.handlers);
    const receiver = second.open(ROOM, b.handlers);
    sender.send(Uint8Array.of(9));
    await Promise.resolve();
    expect(b.log.updates).toEqual([]);
    receiver.close();
    sender.send(Uint8Array.of(3));
    expect(b.log.updates).toEqual([]);
  });
});
