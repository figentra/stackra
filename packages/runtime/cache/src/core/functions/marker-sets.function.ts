/**
 * Stackra file contract:
 * Purpose: `markerSets`, the set calls of a `CacheStore` for a store with prefix listing and no set type (Workers KV,
 *          the client storage area): each member is one empty marker key, `#<URI-encoded set>/<member>`, written with
 *          the member's lifetime, so a set empties itself as its members expire.
 * Boundary: internal to the package. The marker prefix starts with `#`, which `encodeURIComponent` never leaves in a
 *           namespace, so a marker never lies under a cache key; the set name is encoded, so `/` ends it. Adding is a
 *           blind write (no read-modify-write), so concurrent writers never lose a member.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 2).
 */

import type { CacheStore } from "#core/types/cache-store.type";
import type { MarkerStore } from "#core/types/marker-store.type";

/** The marker prefix of `set`. */
const markerPrefix = (set: string): string => `#${encodeURIComponent(set)}/`;

/**
 * `add`, `members` and `clear` over marker keys of `store`.
 *
 * @example
 * const sets = markerSets({ write, delete: remove, keys });
 * await sets.add("t//Category:cat_1", "/Product:prd_1", Duration.minutes(10));
 */
export function markerSets(store: MarkerStore): Pick<CacheStore, "add" | "members" | "clear"> {
  const members = async (set: string): Promise<readonly string[]> => {
    const prefix = markerPrefix(set);
    return (await store.keys(prefix)).map((name) => name.slice(prefix.length));
  };
  return {
    add: (set, member, ttl) => store.write(markerPrefix(set) + member, "", ttl),
    members,
    clear: async (set) => {
      const prefix = markerPrefix(set);
      const names = await members(set);
      await Promise.all(names.map((member) => store.delete(prefix + member)));
    },
  };
}
