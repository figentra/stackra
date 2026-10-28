/**
 * Stackra file contract:
 * Purpose: `memoryEntryStore`, the `CacheEntryStore` of the memory driver: entries by reference in process memory,
 *          the least recently read dropped first past `maxEntries`, dead entries dropped when read, the keys under a
 *          prefix listed from the map, and tag sets that lose a member when its entry goes.
 * Boundary: internal to the package; one process only. An entry is dead once its stale window (or, without one, its
 *           lifetime) has passed on the `Clock`; nothing runs on a timer. Each entry remembers the sets it was added
 *           to, so deleting or evicting it leaves no member behind and the sets stay bounded with the entries.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decisions 1, 2 and 4: memory LRU, namespaced keys, tags).
 */
import type { Clock } from "@stackra/contracts";

import type { CacheEntry } from "#core/types/cache-entry.type";
import type { CacheEntryStore } from "#core/types/cache-entry-store.type";

/**
 * Entries in process memory, at most `maxEntries`.
 *
 * @example
 * this.cache = storedCache(memoryEntryStore(config.maxEntries, clock), namespace, clock, settings);
 */
export function memoryEntryStore(maxEntries: number, clock: Clock): CacheEntryStore {
  /** Key to entry, oldest read first (a `Map` keeps insertion order). */
  const entries = new Map<string, CacheEntry>();
  /** Set name to its members. */
  const sets = new Map<string, Set<string>>();
  /** Key to the sets it is a member of. */
  const memberships = new Map<string, Set<string>>();

  /** Drops `key` and its memberships. */
  const drop = (key: string): void => {
    entries.delete(key);
    for (const name of memberships.get(key) ?? []) {
      const set = sets.get(name);
      set?.delete(key);
      if (set?.size === 0) sets.delete(name);
    }
    memberships.delete(key);
  };

  return {
    read: (key) => {
      const entry = entries.get(key);
      if (entry === undefined) return Promise.resolve(undefined);
      if ((entry.staleUntil ?? entry.expiresAt) <= clock.now().getTime()) {
        drop(key);
        return Promise.resolve(undefined);
      }
      // Move it to the newest end: the bound drops the least recently read first.
      entries.delete(key);
      entries.set(key, entry);
      return Promise.resolve(entry);
    },
    write: (key, entry) => {
      entries.delete(key);
      entries.set(key, entry);
      for (const oldest of entries.keys()) {
        if (entries.size <= maxEntries) break;
        drop(oldest);
      }
      return Promise.resolve();
    },
    delete: (key) => {
      drop(key);
      return Promise.resolve();
    },
    add: (name, member) => {
      const set = sets.get(name) ?? new Set<string>();
      set.add(member);
      sets.set(name, set);
      const joined = memberships.get(member) ?? new Set<string>();
      joined.add(name);
      memberships.set(member, joined);
      return Promise.resolve();
    },
    members: (name) => Promise.resolve([...(sets.get(name) ?? [])]),
    keys: (prefix) => Promise.resolve([...entries.keys()].filter((key) => key.startsWith(prefix))),
    clear: (name) => {
      for (const member of sets.get(name) ?? []) memberships.get(member)?.delete(name);
      sets.delete(name);
      return Promise.resolve();
    },
  };
}
