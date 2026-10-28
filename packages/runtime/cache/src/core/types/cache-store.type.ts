/**
 * Stackra file contract:
 * Purpose: `CacheStore`, what a driver over an outside store (the storage `cache` area, Valkey, Workers KV) hands
 *          `storedCache`: text by key, written with a lifetime, deleted by key, and the keys under a prefix.
 * Boundary: a type only, internal to the package. Keys arrive already behind the namespace; a store may add its own
 *           prefix but hands keys back without it. The lifetime only lets the store reclaim space: `storedCache`
 *           decides what is served from the expiry it keeps beside the value.
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

  /** Every stored key that starts with `prefix`, in any order. */
  keys: (prefix: string) => Promise<readonly string[]>;
}
