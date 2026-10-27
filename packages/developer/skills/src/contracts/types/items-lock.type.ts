/**
 * Stackra file contract:
 * Purpose: `ItemsLock`, the content of `stackra-items.lock.yaml` at the workspace root: every non-package item
 *          `stackra add` installed, pinned by package name, version and integrity, with where it went.
 * Boundary: type only; `ITEMS_LOCK_SCHEMA` checks it. Packages are pinned by pnpm's lockfile, never here.
 * Runtime: isomorphic
 * Governing contract: ADR 0453 (decision 11: the lock's schema is stackra-184's).
 */
import type { ItemsLockEntry } from "#contracts/types/items-lock-entry.type";

/** The parsed `stackra-items.lock.yaml`: every installed item by package name. */
export type ItemsLock = {
  /** The lockfile format version; only 1 exists. */
  readonly lockfileVersion: 1;
  /** By package name, `@stackra/skill-archify`. */
  readonly items: Readonly<Record<string, ItemsLockEntry>>;
};
