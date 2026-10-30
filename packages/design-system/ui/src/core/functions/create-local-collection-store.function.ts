/**
 * Stackra file contract:
 * Purpose: `createLocalCollectionStore()`, the browser driver of the `CollectionStore` port: one JSON entry per collection key in `localStorage`, under a prefix.
 * Boundary: reads and writes through `readStored` and `writeStored`, so a private window or full storage only loses the convenience. A snapshot of another version, or unreadable JSON, reads as none.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { CollectionSnapshot } from "#contracts/types/collection-snapshot.type";
import type { CollectionStore } from "#contracts/types/collection-store.type";
import { readStored } from "#core/functions/read-stored.function";
import { writeStored } from "#core/functions/write-stored.function";

/**
 * A store in the browser's `localStorage`.
 * @param prefix - put before each collection key
 */
export function createLocalCollectionStore(prefix = "stackra.collection."): CollectionStore {
  return {
    get: (key) => {
      const text = readStored(`${prefix}${key}`);
      if (text === undefined) return null;
      try {
        const snapshot = JSON.parse(text) as CollectionSnapshot;
        return snapshot?.version === 1 ? snapshot : null;
      } catch {
        return null;
      }
    },
    save: (key, snapshot) => writeStored(`${prefix}${key}`, JSON.stringify(snapshot)),
  };
}
