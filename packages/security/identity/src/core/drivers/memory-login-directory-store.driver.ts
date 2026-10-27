/**
 * Stackra file contract:
 * Purpose: `MemoryLoginDirectoryStoreDriver`, a `LoginDirectoryStore` held in memory, for tests and local runs.
 * Boundary: process-local; never the deployed directory (that is Cloudflare KV through the deployment's driver).
 *           `keys()` is a test reader, not part of the port.
 * Runtime: isomorphic
 * Governing contract: ADR 0451; ADR 0263 (a driver is named by its class: `memory`).
 */
import { Driver } from "@stackra/container";

import { LoginDirectoryStore } from "#contracts/index";

/**
 * Directory keys held in memory.
 *
 * @example
 * const directory = new MemoryLoginDirectoryStoreDriver();
 */
export class MemoryLoginDirectoryStoreDriver extends Driver(LoginDirectoryStore) {
  /** The written keys. */
  private readonly written = new Set<string>();

  /** Writes each key. */
  put(keys: readonly string[]): Promise<void> {
    for (const key of keys) this.written.add(key);
    return Promise.resolve();
  }

  /** Removes each key. */
  remove(keys: readonly string[]): Promise<void> {
    for (const key of keys) this.written.delete(key);
    return Promise.resolve();
  }

  /** The written keys, sorted. */
  keys(): readonly string[] {
    return [...this.written].sort();
  }
}
