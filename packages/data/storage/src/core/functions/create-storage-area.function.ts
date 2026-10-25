/**
 * Stackra file contract:
 * Purpose: `createStorageArea`, the one implementation of a storage area every driver shares: a memory copy of the
 *          stored text that reads and writes synchronously, values kept as JSON with an optional expiry, shape classes
 *          checked by their generated schemas, and each write persisted to the area's backend in order.
 * Boundary: internal to the package's drivers. Persisted text is untrusted (the user can edit Web Storage): an entry
 *           that is not a stored envelope reads as absent and is removed. A synchronous backend is loaded at once, an
 *           asynchronous one by `hydrate()`, and a write made before that finishes wins over the loaded value. A
 *           failed backend write never throws at the caller; it rejects the next `flush()`.
 * Runtime: isomorphic
 * Governing contract: ADR 0256 (decisions 2 to 4), ADR 0294 (decision 26: values are checked by the generated
 *                     schema).
 */
import type { AnyClass } from "@stackra/container";
import { Duration, type Json } from "@stackra/contracts";
import { validate } from "@stackra/validation";

import type { StorageWriteOptions } from "#contracts/types/storage-write-options.type";
import { storageKeyOf } from "#core/functions/storage-key-of.function";
import type { PersistedStorageArea } from "#core/types/persisted-storage-area.type";
import type { StorageBackend } from "#core/types/storage-backend.type";

/** What one entry's text holds: the value and, with a time-to-live, its expiry in epoch milliseconds. */
interface Envelope {
  readonly v: Json;
  readonly e?: number;
}

/** The envelope in `text`, or `undefined` when the text is not one. */
function envelopeOf(text: string): Envelope | undefined {
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null || !("v" in parsed)) return undefined;
    const expires = (parsed as { e?: unknown }).e;
    return expires === undefined || typeof expires === "number" ? (parsed as Envelope) : undefined;
  } catch {
    return undefined;
  }
}

/** Whether `value` is a promise. */
const isPromise = <T>(value: T | Promise<T>): value is Promise<T> =>
  typeof (value as { then?: unknown } | null)?.then === "function";

/**
 * A storage area persisted to `backend`, or kept in memory only when there is none.
 *
 * @example
 * this.prefs = createStorageArea(webStorageBackend(localStorage, StorageArea.Prefs));
 */
export function createStorageArea(backend?: StorageBackend): PersistedStorageArea {
  const entries = new Map<string, string>();
  let pending: Promise<void> = Promise.resolve();
  let failure: { readonly error: unknown } | undefined;

  /** Queues one backend call after the ones before it; a failure is kept for `flush`. */
  const persist = (work: (backend: StorageBackend) => void | Promise<void>): void => {
    if (backend === undefined) return;
    pending = pending
      .then(() => work(backend))
      .catch((error: unknown) => {
        failure ??= { error };
      });
  };

  /** Adds loaded entries; a key written since the area was created keeps its newer value. */
  const fill = (loaded: Iterable<readonly [string, string]>): void => {
    for (const [key, text] of loaded) if (!entries.has(key)) entries.set(key, text);
  };

  const remove = (key: string): void => {
    if (!entries.delete(key)) return;
    persist((target) => target.remove(key));
  };

  /** The live envelope under `key`; an expired or unreadable entry is removed. */
  const live = (key: string): Envelope | undefined => {
    const text = entries.get(key);
    if (text === undefined) return undefined;
    const envelope = envelopeOf(text);
    if (envelope !== undefined && (envelope.e === undefined || envelope.e > Date.now()))
      return envelope;
    remove(key);
    return undefined;
  };

  const set = (key: string, value: unknown, options?: StorageWriteOptions): void => {
    const json = JSON.stringify(value) as string | undefined;
    if (json === undefined)
      throw new TypeError(`"${key}" cannot be stored: a ${typeof value} has no JSON form`);
    let text = `{"v":${json}}`;
    if (options?.ttl !== undefined) {
      const lifetime = Duration.toMilliseconds(options.ttl);
      if (!Number.isFinite(lifetime))
        throw new RangeError(`"${String(options.ttl)}" is not a duration`);
      text = `{"v":${json},"e":${Date.now() + lifetime}}`;
    }
    entries.set(key, text);
    persist((target) => target.save(key, text));
  };

  let hydrated: Promise<void> = Promise.resolve();
  const initial = backend?.load();
  if (initial !== undefined && isPromise(initial)) {
    hydrated = initial.then(fill);
    // A load nobody awaits must not surface as an unhandled rejection; `hydrate()` still rejects with it.
    hydrated.catch(() => undefined);
  } else if (initial !== undefined) fill(initial);

  return {
    get: (key) => live(key)?.v,
    set,
    has: (key) => live(key) !== undefined,
    delete: remove,
    keys: () => [...entries.keys()].filter((key) => live(key) !== undefined),
    clear: () => {
      // Deleting the current entry while iterating a Map is safe: iteration continues with the next one.
      for (const key of entries.keys()) remove(key);
    },
    read<T extends object>(type: AnyClass<T>): T {
      const stored = live(storageKeyOf(type).key)?.v;
      const parsed = validate(type, stored ?? {});
      if (parsed.success) return parsed.data;
      // A value an older release wrote that no longer fits: fall back to the shape's defaults.
      const defaults = stored === undefined ? parsed : validate(type, {});
      if (defaults.success) return defaults.data;
      throw parsed.error;
    },
    write<T extends object>(type: AnyClass<T>, value: T, options?: StorageWriteOptions): void {
      const { key } = storageKeyOf(type);
      // Checked in its wire form, as it will be read back: a Date becomes its ISO string first.
      const parsed = validate(type, JSON.parse(JSON.stringify(value) ?? "null"));
      if (!parsed.success) throw parsed.error;
      set(key, parsed.data, options);
    },
    hydrate: () => hydrated,
    async flush(): Promise<void> {
      let settled: Promise<void>;
      do {
        settled = pending;
        await settled;
      } while (settled !== pending);
      const failed = failure;
      failure = undefined;
      if (failed !== undefined) throw failed.error;
    },
  };
}
