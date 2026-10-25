/**
 * Stackra file contract:
 * Purpose: `WebStorageDriver`, the `Storage` driver of the web and PWA targets: `prefs` and `cache` persist in
 *          `localStorage`, `session` in `sessionStorage`, each under a `stackra:<area>:` prefix so the origin's other
 *          keys are never read or touched.
 * Boundary: browser only. `secrets` stays in memory on purpose: any script on the origin reads Web Storage, so a
 *           secret never rests there (ADR 0256: the web keeps secrets behind a non-extractable WebCrypto key). When the
 *           browser refuses Web Storage (privacy mode, blocked site data), that area falls back to memory instead of
 *           failing the boot. A quota error surfaces on `flush()`, never at the writer.
 * Runtime: browser
 * Governing contract: ADR 0256 (decisions 2 to 4), ADR 0127 2026-10-24 note (`./browser` holds browser-only drivers).
 */
import { AreaStorageDriver } from "#core/drivers/area-storage.driver";
import { StorageArea } from "#core/enums/storage-area.enum";
import type { StorageBackend } from "#core/types/storage-backend.type";

/** One of the browser's two Web Storage objects. */
type WebStorage = typeof globalThis.localStorage;

/** The browser's `localStorage` or `sessionStorage`, or `undefined` when it is missing or refused. */
function webStorageOf(name: "localStorage" | "sessionStorage"): WebStorage | undefined {
  try {
    return globalThis[name] ?? undefined;
  } catch {
    return undefined;
  }
}

/** A backend over `storage` that sees only the keys of `area`. */
function webStorageBackend(
  storage: WebStorage | undefined,
  area: StorageArea,
): StorageBackend | undefined {
  if (storage === undefined) return undefined;
  const prefix = `stackra:${area}:`;
  return {
    load() {
      const loaded: [string, string][] = [];
      for (let index = 0; index < storage.length; index += 1) {
        const name = storage.key(index);
        const text = name?.startsWith(prefix) ? storage.getItem(name) : null;
        if (name !== null && text !== null) loaded.push([name.slice(prefix.length), text]);
      }
      return loaded;
    },
    save: (key, text) => storage.setItem(prefix + key, text),
    remove: (key) => storage.removeItem(prefix + key),
  };
}

/**
 * Storage in the browser.
 *
 * @example
 * drivers: [{ port: Storage, candidates: { web: () => import("@stackra/storage/browser").then((m) => m.WebStorageDriver) } }]
 */
export class WebStorageDriver extends AreaStorageDriver {
  /** Reads the browser's Web Storage once, when the container builds the driver. */
  constructor() {
    const local = webStorageOf("localStorage");
    // shortcut: outbox and files live in memory until the IndexedDB and OPFS backends land here; testing them needs
    // fake-indexeddb in the catalog.
    super({
      prefs: webStorageBackend(local, StorageArea.Prefs),
      cache: webStorageBackend(local, StorageArea.Cache),
      session: webStorageBackend(webStorageOf("sessionStorage"), StorageArea.Session),
    });
  }
}
