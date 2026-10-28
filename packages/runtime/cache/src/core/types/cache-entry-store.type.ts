/**
 * Stackra file contract:
 * Purpose: `CacheEntryStore`, what `storedCache` runs over: entries by key, named sets of keys (the keys carrying each
 *          tag, and without `keys` the keys under each covering key), and the keys under a prefix when it can list them.
 * Boundary: a type only, internal to the package. `textEntryStore` makes one from an outside `CacheStore` (entries as
 *           JSON text); `memoryEntryStore` keeps entries by reference with the LRU bound. Keys and set names arrive
 *           behind the namespace. A set may keep a member whose entry is gone.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decisions 1, 2 and 4).
 */
import type { Duration } from "@stackra/contracts";

import type { CacheEntry } from "#core/types/cache-entry.type";

/** Entries and key sets behind one cache. */
export interface CacheEntryStore {
  /** The entry under `key`, or `undefined` when none is stored (or what is stored is not an entry). */
  read: (key: string) => Promise<CacheEntry | undefined>;

  /** Stores `entry` under `key`, kept at least `ttl`. */
  write: (key: string, entry: CacheEntry, ttl: Duration) => Promise<void>;

  /** Removes `key`; nothing happens when it is not stored. */
  delete: (key: string) => Promise<void>;

  /** Adds `member` to the set `set`, kept at least `ttl`. */
  add: (set: string, member: string, ttl: Duration) => Promise<void>;

  /** Every member of `set`. */
  members: (set: string) => Promise<readonly string[]>;

  /** Removes the set `set`. */
  clear: (set: string) => Promise<void>;

  /** Every stored key that starts with `prefix`; absent when the store cannot list a prefix without a scan. */
  keys?: (prefix: string) => Promise<readonly string[]>;
}
