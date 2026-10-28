/**
 * Stackra file contract:
 * Purpose: `PersistedStorageArea`, a storage area as a driver holds it: the public handle plus the two lifecycle calls
 *          the driver forwards from `Storage.hydrate()` and `Storage.flush()`.
 * Boundary: a type only, internal to the package's drivers; consumers see `StorageAreaHandle`.
 * Runtime: isomorphic
 * Governing contract: ADR 0256 (decisions 2 to 4).
 */
import type { StorageAreaHandle } from "#contracts/types/storage-area-handle.type";

/** One area with its lifecycle. */
export interface PersistedStorageArea extends StorageAreaHandle {
  /** Resolves once what the backend persisted is loaded. */
  hydrate: () => Promise<void>;

  /** Resolves once every write so far is persisted; rejects with the first failed write since the last flush. */
  flush: () => Promise<void>;
}
