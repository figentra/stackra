/**
 * Stackra file contract:
 * Purpose: `STORAGE_KEY_REGISTRY`, the stored identity of each class, filled by `registerStorageKeys` from the
 *          generated code and read by `storageKeyOf`.
 * Boundary: module state, internal to the package; keyed by the class itself, so a subclass needs its own entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20).
 */
import type { AnyClass } from "@stackra/container";

import type { StorageKey } from "#core/types/storage-key.type";

/** Class to stored identity. */
export const STORAGE_KEY_REGISTRY = new WeakMap<AnyClass, StorageKey>();
