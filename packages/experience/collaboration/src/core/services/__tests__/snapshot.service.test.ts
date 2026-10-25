/**
 * Stackra file contract:
 * Purpose: unit tests of `SnapshotService`: restore applies the latest snapshot or reports none; save stores the full
 *          state with its time; tracking saves at most once per interval after local changes only, saves pending
 *          changes on stop, stops once, and logs a failed save without throwing.
 * Boundary: test only; the store is this package's memory driver, timers are faked, the replica is a set of numbers.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0225 (decision 2: snapshots).
 */
import { buildConfig } from "@stackra/config";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CollaborationConfig } from "#config/collaboration.config";
import type { CollaborationRoom } from "#contracts/types/collaboration-room.type";
import type { DocumentReplica } from "#contracts/types/document-replica.type";
import { SnapshotService } from "#core/services/snapshot.service";
import { MemorySnapshotStoreDriver } from "#testing/drivers/memory-snapshot-store.driver";

const ROOM: CollaborationRoom = { document: "pag_01j9z3k4m5n6p7q8r9s0t1v2w3" };

/** A grow-only set of numbers standing in for a Yjs document. */
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

/** A service over a fresh memory store with the default 30-second interval. */
function service(store = new MemorySnapshotStoreDriver()) {
  return { store, snapshots: new SnapshotService(buildConfig(CollaborationConfig), store) };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("SnapshotService", () => {
  it("restores the latest snapshot, or reports none", async () => {
    const { store, snapshots } = service();
    const replica = new SetReplica();
    expect(await snapshots.restore(ROOM, replica)).toBe(false);
    await store.save(ROOM, { state: Uint8Array.of(4, 5), savedAt: new Date() });
    expect(await snapshots.restore(ROOM, replica)).toBe(true);
    expect([...replica.items]).toEqual([4, 5]);
  });

  it("saves the full state with the time it was taken", async () => {
    vi.useFakeTimers({ now: new Date("2026-10-24T10:00:00Z") });
    const { store, snapshots } = service();
    const replica = new SetReplica();
    replica.add(1);
    replica.add(2);
    await snapshots.save(ROOM, replica);
    expect(await store.latest(ROOM)).toEqual({
      state: Uint8Array.of(1, 2),
      savedAt: new Date("2026-10-24T10:00:00Z"),
    });
  });

  it("saves at most once per interval after local changes, and on stop", async () => {
    vi.useFakeTimers();
    const { store, snapshots } = service();
    const save = vi.spyOn(store, "save");
    const replica = new SetReplica();
    const stop = snapshots.track(ROOM, replica);
    replica.apply(Uint8Array.of(9));
    vi.advanceTimersByTime(30_000);
    expect(save).not.toHaveBeenCalled();
    replica.add(1);
    vi.advanceTimersByTime(10_000);
    replica.add(2);
    vi.advanceTimersByTime(20_000);
    expect(save).toHaveBeenCalledTimes(1);
    replica.add(3);
    stop();
    stop();
    expect(save).toHaveBeenCalledTimes(2);
    expect((await store.latest(ROOM))?.state).toEqual(Uint8Array.of(9, 1, 2, 3));
    replica.add(4);
    vi.advanceTimersByTime(30_000);
    expect(save).toHaveBeenCalledTimes(2);
  });

  it("does not save on stop when nothing changed", () => {
    const { store, snapshots } = service();
    const save = vi.spyOn(store, "save");
    snapshots.track(ROOM, new SetReplica())();
    expect(save).not.toHaveBeenCalled();
  });

  it("logs a failed tracked save without throwing", async () => {
    vi.useFakeTimers();
    const { store, snapshots } = service();
    vi.spyOn(store, "save").mockRejectedValue(new Error("store down"));
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const replica = new SetReplica();
    snapshots.track(ROOM, replica);
    replica.add(1);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(log).toHaveBeenCalledWith(`A snapshot of ${ROOM.document} failed`, expect.any(Error));
  });
});
