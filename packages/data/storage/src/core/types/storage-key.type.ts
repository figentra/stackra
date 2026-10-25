/**
 * Stackra file contract:
 * Purpose: `StorageKey`, where the value of one class is stored: its derived key and, for a class that persists
 *          itself, its area. Gen registers one per stored class with `registerStorageKeys`.
 * Boundary: a type only. The key is derived by gen like every identity (`<member>.<snake(stem)>`, ADR 0294 decision
 *           20) and locked in the manifest; authors never write it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20), ADR 0256 (decision 2).
 */
import type { StorageArea } from "#core/enums/storage-area.enum";

/** The stored identity of one class. */
export interface StorageKey {
  /** The derived key (`console.device_prefs`, `mobile.preferences`). */
  readonly key: string;

  /** The area `Storage.store(type)` uses; `prefs` when absent. An area handle's `read`/`write` use their own area. */
  readonly area?: StorageArea;
}
