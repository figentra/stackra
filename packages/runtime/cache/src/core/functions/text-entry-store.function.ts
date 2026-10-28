/**
 * Stackra file contract:
 * Purpose: `textEntryStore`, the `CacheEntryStore` over an outside `CacheStore`: each entry kept as JSON text
 *          (`{ value, expiresAt }`, plus `staleUntil` when it has a stale window), and stored text that is not an
 *          entry read as absent.
 * Boundary: internal to the package; the storage, Valkey and Workers drivers wrap their store with it. Stored text is
 *           untrusted: anything without a numeric `expiresAt` (and a numeric `staleUntil` when present) is absent.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decisions 1, 2 and 4).
 */
import type { CacheEntry } from "#core/types/cache-entry.type";
import type { CacheEntryStore } from "#core/types/cache-entry-store.type";
import type { CacheStore } from "#core/types/cache-store.type";

/** The entry in `text`, or `undefined` when the text is not one. */
function entryOf(text: string): CacheEntry | undefined {
  try {
    const entry = JSON.parse(text) as Partial<CacheEntry> | null;
    if (typeof entry !== "object" || entry === null || typeof entry.expiresAt !== "number")
      return undefined;
    if (entry.staleUntil !== undefined && typeof entry.staleUntil !== "number") return undefined;
    return entry as CacheEntry;
  } catch {
    return undefined;
  }
}

/**
 * The entries of `store`, as JSON text.
 *
 * @example
 * this.cache = storedCache(textEntryStore(store), namespace, clock, settings);
 */
export function textEntryStore(store: CacheStore): CacheEntryStore {
  const { keys } = store;
  return {
    ...(keys === undefined ? {} : { keys }),
    read: async (key) => {
      const text = await store.read(key);
      return text === undefined ? undefined : entryOf(text);
    },
    write: (key, entry, ttl) => store.write(key, JSON.stringify(entry), ttl),
    delete: (key) => store.delete(key),
    add: (set, member, ttl) => store.add(set, member, ttl),
    members: (set) => store.members(set),
    clear: (set) => store.clear(set),
  };
}
