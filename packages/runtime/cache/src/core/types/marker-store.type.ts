/**
 * Stackra file contract:
 * Purpose: `MarkerStore`, what `markerSets` needs from a store that has prefix listing and no set type (Workers KV, the
 *          client storage area): raw text writes with a lifetime, deletes, and the keys under a prefix.
 * Boundary: a type only, internal to the package. Keys arrive already behind any namespace; the store adds its own
 *           prefix and hands keys back without it.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 2).
 */
import type { Duration } from "@stackra/contracts";

/** Raw writes and deletes, and the keys under a prefix. */
export interface MarkerStore {
  /** Stores `text` under `key` for at least `ttl`. */
  write: (key: string, text: string, ttl: Duration) => Promise<void>;

  /** Removes `key`. */
  delete: (key: string) => Promise<void>;

  /** Every stored key that starts with `prefix`. */
  keys: (prefix: string) => Promise<readonly string[]>;
}
