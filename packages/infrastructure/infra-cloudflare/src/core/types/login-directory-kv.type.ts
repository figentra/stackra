/**
 * Stackra file contract:
 * Purpose: `LoginDirectoryKv`, the part of a Workers KV namespace binding the login directory Worker reads: a list by
 *          key prefix.
 * Boundary: type only; a real `KVNamespace` binding satisfies it, and a test passes a map. No write: the Worker only
 *           reads, and each region writes through the Cloudflare API (`loginDirectoryKvRequest`).
 * Runtime: isomorphic
 * Governing contract: ADR 0451; ADR 0353 (decision 4).
 */

/** The KV read the directory needs. */
export type LoginDirectoryKv = {
  /** Lists the keys that start with `prefix`. */
  list: (options: {
    readonly prefix: string;
  }) => Promise<{ readonly keys: readonly { readonly name: string }[] }>;
};
