/**
 * Stackra file contract:
 * Purpose: `WorkersKvNamespace`, a Workers KV namespace binding as `WorkersCacheDriver` uses it: text by key, written
 *          with an expiry, deleted by key, and listed by prefix a page at a time.
 * Boundary: a type only, structurally a subset of the runtime's own `KVNamespace`, so this package needs no Workers
 *           type package. Internal to the `./worker` entry, so its option shapes stay inline.
 * Runtime: worker
 * Governing contract: ADR 0284 (Workers members); ADR 0297 (decision 3).
 */

/** A KV namespace binding. */
export interface WorkersKvNamespace {
  /** The text under `key`, or `null` when none is stored. */
  get(key: string, type: "text"): Promise<string | null>;

  /** Stores `value` under `key`; KV drops it after `expirationTtl` seconds (at least 60). */
  put(key: string, value: string, options: { readonly expirationTtl: number }): Promise<void>;

  /** Removes `key`. */
  delete(key: string): Promise<void>;

  /** One page of the keys that start with `prefix`, from `cursor` on. */
  list(options: { readonly prefix: string; readonly cursor?: string }): Promise<{
    readonly keys: readonly { readonly name: string }[];
    readonly list_complete: boolean;
    readonly cursor?: string;
  }>;
}
