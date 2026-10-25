/**
 * Stackra file contract:
 * Purpose: the `Storage` port: the one client storage service (ADR 0256), injected by type, with its six named areas
 *          (`prefs`, `session`, `cache`, `outbox`, `secrets`, `files`), the persisted state of a class, and the two
 *          lifecycle calls a runtime makes: `hydrate()` before the first frame, `flush()` before it exits.
 * Boundary: an abstract class that is its own token; a driver per platform implements it with `extends Driver(Storage)`
 *           and decides where each area lives. Each area is a property named by its `StorageArea` code, so
 *           `storage[area]` is the area of an enum value; this leaf entry imports nothing else from the package.
 * Runtime: isomorphic
 * Governing contract: ADR 0256 (decisions 1 to 4), ADR 0294 (decisions 15, 16 and 17), ADR 0266 (memory drivers
 *                     first).
 */
import type { AnyClass } from "@stackra/container";
import { Port } from "@stackra/contracts";

import type { StorageAreaHandle } from "#contracts/types/storage-area-handle.type";
import type { StoredRecord } from "#contracts/types/stored-record.type";

/**
 * Client storage: one handle per area, read synchronously and persisted by the area's backend.
 *
 * @example
 * const storage = app.get(Storage);
 * storage.prefs.set("theming.scheme", "dark");
 * storage[StorageArea.Cache].set("catalogue.page_1", rows, { ttl: Duration.minutes(10) });
 * await storage.flush();
 */
export abstract class Storage extends Port {
  /** Per-install preferences and persisted client state; kept across sessions. */
  abstract readonly prefs: StorageAreaHandle;

  /** Values for the current session only. */
  abstract readonly session: StorageAreaHandle;

  /** Disposable cached data a reload may rebuild. */
  abstract readonly cache: StorageAreaHandle;

  /** The offline queue of writes waiting to be sent. */
  abstract readonly outbox: StorageAreaHandle;

  /** Secrets the client must keep (tokens, keys); a driver keeps them only where the platform protects them. */
  abstract readonly secrets: StorageAreaHandle;

  /** File references and small file payloads. */
  abstract readonly files: StorageAreaHandle;

  /**
   * The persisted state of `type`, under the key and area gen registered for it.
   *
   * @throws TypeError when gen registered no key for `type`.
   */
  abstract store<T extends object>(type: AnyClass<T>): StoredRecord<T>;

  /** Loads what the areas persisted; resolves once every area can be read. Safe to call more than once. */
  abstract hydrate(): Promise<void>;

  /** Resolves once every write so far is persisted; rejects with the first write that failed since the last flush. */
  abstract flush(): Promise<void>;
}
