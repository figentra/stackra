/**
 * Stackra file contract:
 * Purpose: `storageKeyOf`, which reads the stored identity of a class from the registry: the lookup behind an area's
 *          `read`/`write` and `Storage.store`.
 * Boundary: reads the registry only, matching the class exactly. A class with no entry is a build or setup mistake, so
 *           it throws instead of guessing a key that a later release would not find.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20).
 */
import type { AnyClass } from "@stackra/container";

import { STORAGE_KEY_REGISTRY } from "#core/constants/storage-key-registry.constant";
import type { StorageKey } from "#core/types/storage-key.type";

/**
 * The stored identity registered for `type`.
 *
 * @throws TypeError when no key is registered for `type` itself.
 */
export function storageKeyOf(type: AnyClass): StorageKey {
  const entry = STORAGE_KEY_REGISTRY.get(type);
  if (entry === undefined)
    throw new TypeError(
      `${type.name || "This class"} has no storage key: run \`stackra gen\` and load its member's generated code, ` +
        `or call registerStorageKeys([[${type.name || "Class"}, { key }]]) in a test`,
    );
  return entry;
}
