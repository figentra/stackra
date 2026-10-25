/**
 * Stackra file contract:
 * Purpose: `registerStorageKeys`, which links each stored class (a shape a package keeps in an area, a store that
 *          persists itself) to its derived key and area, so `prefs.read(DevicePrefs)` and `storage.store(UiStore)` find
 *          them. Each generated member file calls it once with its pairs; a test calls it for its own classes.
 * Boundary: writes the registry only. Registering a class again replaces its entry (a reloaded dev module).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: identities are derived, gen writes them), ADR 0256 (decision 2).
 */
import type { AnyClass } from "@stackra/container";

import { STORAGE_KEY_REGISTRY } from "#core/constants/storage-key-registry.constant";
import type { StorageKey } from "#core/types/storage-key.type";

/**
 * Records where each class is stored.
 *
 * @param pairs - `[Class, { key, area? }]` pairs, as a generated file lists them.
 * @throws RangeError when a key is empty.
 * @example
 * registerStorageKeys([
 *   [DevicePrefs, { key: "console.device_prefs" }],
 *   [UiStore, { key: "console.ui", area: StorageArea.Prefs }],
 * ]);
 */
export function registerStorageKeys(pairs: readonly (readonly [AnyClass, StorageKey])[]): void {
  for (const [type, entry] of pairs) {
    if (entry.key === "")
      throw new RangeError(`${type.name || "A class"} has an empty storage key`);
    STORAGE_KEY_REGISTRY.set(type, entry);
  }
}
