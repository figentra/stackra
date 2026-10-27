/**
 * Stackra file contract:
 * Purpose: `KvNamespace`: the KV namespace binding.
 * Boundary: types only. Each interface is a subset of the platform's; never add a member the Worker does not call.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 3).
 */

/** The KV namespace binding. */
export interface KvNamespace {
  /** Resolves to the value stored under the key, or null when it is absent. */
  get(key: string): Promise<string | null>;
  /** Stores a value under the key, optionally expiring after a number of seconds. */
  put(key: string, value: string, options?: { readonly expirationTtl?: number }): Promise<void>;
  /** Removes the value stored under the key. */
  delete(key: string): Promise<void>;
}
