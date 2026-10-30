/**
 * Stackra file contract:
 * Purpose: `CollectionStore`, the persistence port of a collection: get and save a `CollectionSnapshot` by collection key. The browser driver is `createLocalCollectionStore`; products implement server drivers.
 * Boundary: types only; either method may answer at once or with a promise.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { CollectionSnapshot } from "#contracts/types/collection-snapshot.type";

/** Where a collection keeps its columns, sort, filters and views between visits. */
export interface CollectionStore {
  /** The snapshot saved under `key`, or `null` when there is none. */
  readonly get: (key: string) => CollectionSnapshot | null | Promise<CollectionSnapshot | null>;
  /** Saves the snapshot under `key`. */
  readonly save: (key: string, snapshot: CollectionSnapshot) => void | Promise<void>;
}
