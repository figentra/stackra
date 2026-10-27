/**
 * Stackra file contract:
 * Purpose: `AreaStorageDriver`, the base every `Storage` driver of this package extends: it builds the six areas over
 *          the backends a platform driver passes (memory for any area without one), routes `store(type)` to the area
 *          gen registered, and forwards `hydrate()` and `flush()` to every area.
 * Boundary: abstract and internal to the package: a platform driver is a subclass whose constructor takes nothing (the
 *           container builds it, and gen reads constructor parameters as dependencies) and passes its backends to
 *           `super`. It holds no platform code of its own.
 * Runtime: isomorphic
 * Governing contract: ADR 0256 (decisions 2 and 3), ADR 0294 (decisions 16 and 25), ADR 0266 (memory drivers first).
 */
import { Driver, type AnyClass } from "@stackra/container";

import { Storage } from "#contracts/ports/storage.port";
import type { StoredRecord } from "#contracts/types/stored-record.type";
import { StorageArea } from "#core/enums/storage-area.enum";
import { createStorageArea } from "#core/functions/create-storage-area.function";
import { storageKeyOf } from "#core/functions/storage-key-of.function";
import type { PersistedStorageArea } from "#core/types/persisted-storage-area.type";
import type { StorageBackend } from "#core/types/storage-backend.type";

/**
 * The shared base of this package's storage drivers.
 *
 * @example
 * export class WebStorageDriver extends AreaStorageDriver {
 *   constructor() {
 *     super({ prefs: webStorageBackend(localStorage, StorageArea.Prefs) });
 *   }
 * }
 */
export abstract class AreaStorageDriver extends Driver(Storage) {
  /** Preferences and persisted client state. */
  readonly prefs: PersistedStorageArea;

  /** The current session. */
  readonly session: PersistedStorageArea;

  /** Disposable cached data. */
  readonly cache: PersistedStorageArea;

  /** The offline queue. */
  readonly outbox: PersistedStorageArea;

  /** Secrets, in the platform's secure store. */
  readonly secrets: PersistedStorageArea;

  /** Files and other large blobs. */
  readonly files: PersistedStorageArea;

  /**
   * @param backends - where each area persists; an area without a backend lives in memory.
   */
  protected constructor(
    backends: Partial<Readonly<Record<StorageArea, StorageBackend | undefined>>>,
  ) {
    super();
    this.prefs = createStorageArea(backends.prefs);
    this.session = createStorageArea(backends.session);
    this.cache = createStorageArea(backends.cache);
    this.outbox = createStorageArea(backends.outbox);
    this.secrets = createStorageArea(backends.secrets);
    this.files = createStorageArea(backends.files);
  }

  /** The persisted state of `type`, in its registered area (`prefs` when it names none). */
  store<T extends object>(type: AnyClass<T>): StoredRecord<T> {
    const { key, area = StorageArea.Prefs } = storageKeyOf(type);
    const handle = this[area];
    return {
      read: () => handle.get(key) as Partial<T> | undefined,
      write: (state, options) => handle.set(key, state, options),
      clear: () => handle.delete(key),
    };
  }

  /** Loads every area. */
  async hydrate(): Promise<void> {
    await Promise.all(this.areas().map((area) => area.hydrate()));
  }

  /** Waits for every area's writes; rejects with the first failure. */
  async flush(): Promise<void> {
    await Promise.all(this.areas().map((area) => area.flush()));
  }

  /** The six areas, in `StorageArea` order. */
  private areas(): PersistedStorageArea[] {
    return [this.prefs, this.session, this.cache, this.outbox, this.secrets, this.files];
  }
}
