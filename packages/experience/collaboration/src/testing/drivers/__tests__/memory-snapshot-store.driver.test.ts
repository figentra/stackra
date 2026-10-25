/**
 * Stackra file contract:
 * Purpose: unit tests of `MemorySnapshotStoreDriver`: nothing before a save, the latest snapshot per document after.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0225 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import type { CollaborationRoom } from "#contracts/index";
import { MemorySnapshotStoreDriver } from "#testing/drivers/memory-snapshot-store.driver";

const ROOM: CollaborationRoom = { document: "pag_01j9z3k4m5n6p7q8r9s0t1v2w3" };
const OTHER: CollaborationRoom = { document: "pag_01j9z3k4m5n6p7q8r9s0t1v2w4" };

describe("MemorySnapshotStoreDriver", () => {
  it("keeps the latest snapshot per document", async () => {
    const store = new MemorySnapshotStoreDriver();
    expect(await store.latest(ROOM)).toBeUndefined();
    const first = { state: Uint8Array.of(1), savedAt: new Date("2026-10-24T10:00:00Z") };
    const second = { state: Uint8Array.of(1, 2), savedAt: new Date("2026-10-24T10:00:30Z") };
    await store.save(ROOM, first);
    await store.save(ROOM, second);
    expect(await store.latest(ROOM)).toBe(second);
    expect(await store.latest(OTHER)).toBeUndefined();
  });
});
