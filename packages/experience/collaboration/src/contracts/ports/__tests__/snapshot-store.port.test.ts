/**
 * Stackra file contract:
 * Purpose: unit tests of the `SnapshotStore` port: a port a snapshot driver implements and a class token; `latest`
 *          answers `undefined` before any save.
 * Boundary: test only; the driver is a hand-rolled one keyed by the document.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0225 (decision 2); ADR 0294 (decision 4).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { SnapshotStore } from "#contracts/ports/snapshot-store.port";
import type { CollaborationRoom } from "#contracts/types/collaboration-room.type";
import type { DocumentSnapshot } from "#contracts/types/document-snapshot.type";

describe("SnapshotStore", () => {
  it("is a port a snapshot driver implements", async () => {
    class MapStore extends SnapshotStore {
      private readonly saved = new Map<string, DocumentSnapshot>();

      save(room: CollaborationRoom, snapshot: DocumentSnapshot): Promise<void> {
        this.saved.set(room.document, snapshot);
        return Promise.resolve();
      }

      latest(room: CollaborationRoom): Promise<DocumentSnapshot | undefined> {
        return Promise.resolve(this.saved.get(room.document));
      }
    }
    const store = new MapStore();
    const room: CollaborationRoom = { document: "pag_01j9z3k4m5n6p7q8r9s0t1v2w3" };
    expect(await store.latest(room)).toBeUndefined();
    const snapshot = { state: new Uint8Array([7]), savedAt: new Date("2026-10-24T10:00:00Z") };
    await store.save(room, snapshot);
    expect(await store.latest(room)).toBe(snapshot);
    expect(store).toBeInstanceOf(SnapshotStore);
    expect(store).toBeInstanceOf(Port);
  });
});
