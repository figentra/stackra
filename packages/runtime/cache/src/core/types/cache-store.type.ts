/**
 * Stackra file contract:
 * Purpose: `CacheStore`, what a driver over an outside store (the storage `cache` area, Valkey, Workers KV) hands
 *          `storedCache`: text by key, written with a lifetime, deleted by key, named sets of keys (the keys carrying a
 *          tag, and for a store that cannot list a prefix, the keys under each covering key), and, when the store lists
 *          keys by prefix cheaply, that listing, so `forget` and `forgetTag` never scan the whole store.
 * Boundary: a type only, internal to the package. Keys and set names arrive already behind the namespace; a store keeps
 *           sets apart from keys in its own way (Valkey sorted sets, Postgres a member table, KV and the storage area
 *           one marker key per member) and may add its own prefix, but hands keys and members back without it. A store
 *           without `keys` (Valkey) gets each key indexed under every key that covers it instead. The lifetime only lets the store reclaim
 *           space: `storedCache` decides what is served from the expiry it keeps beside the value. A set may keep a
 *           member whose key is gone; deleting it again is harmless.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decisions 1 and 2).
 */
import type { Duration } from "@stackra/contracts";

/** One outside store of cache text. */
export interface CacheStore {
  /** The text under `key`, or `undefined` when none is stored. */
  read: (key: string) => Promise<string | undefined>;

  /** Stores `text` under `key`, kept at least for `ttl` (a lifetime above zero). */
  write: (key: string, text: string, ttl: Duration) => Promise<void>;

  /** Removes `key`; nothing happens when it is not stored. */
  delete: (key: string) => Promise<void>;

  /** Adds `member` to the set `set`, keeping the set at least `ttl`; adding a member twice keeps it once. */
  add: (set: string, member: string, ttl: Duration) => Promise<void>;

  /** Every member of `set`, in any order; none when the set is not stored. */
  members: (set: string) => Promise<readonly string[]>;

  /** Removes the set `set`; the keys its members name stay. */
  clear: (set: string) => Promise<void>;

  /** Every stored entry key that starts with `prefix`, in any order, never a set's; absent when listing would scan. */
  keys?: (prefix: string) => Promise<readonly string[]>;
}
