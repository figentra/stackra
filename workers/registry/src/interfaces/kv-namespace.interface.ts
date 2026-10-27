/**
 * Stackra file contract:
 * Purpose: `KvNamespace`: the KV namespace binding.
 * Boundary: types only. Each interface is a subset of the platform's; never add a member the Worker does not call.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 3).
 */

/** The KV namespace binding. */
export interface KvNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { readonly expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}
