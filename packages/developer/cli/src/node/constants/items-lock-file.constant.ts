/**
 * Stackra file contract:
 * Purpose: `ITEMS_LOCK_FILE`, the lock `stackra add` writes at the workspace root for every non-package item.
 * Boundary: the file name only; its shape is `ItemsLock` of `@stackra/skills/contracts`.
 * Runtime: node
 * Governing contract: ADR 0453 (decision 11).
 */

/** The items lock, beside `pnpm-workspace.yaml`. */
export const ITEMS_LOCK_FILE = "stackra-items.lock.yaml";
