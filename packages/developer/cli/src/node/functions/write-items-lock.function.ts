/**
 * Stackra file contract:
 * Purpose: `writeItemsLock(root, lock)`, writes `stackra-items.lock.yaml` with its items sorted by name, so the file
 *          diffs cleanly.
 * Boundary: writes one file; checks the lock with `ITEMS_LOCK_SCHEMA` first, so a bad entry is never written.
 * Runtime: node
 * Governing contract: ADR 0453 (decision 11).
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { ITEMS_LOCK_SCHEMA, type ItemsLock } from "@stackra/skills/contracts";
import { stringify } from "yaml";

import { ITEMS_LOCK_FILE } from "#node/constants/items-lock-file.constant";

/**
 * Writes the items lock of the workspace at `root`.
 *
 * @param root - the workspace root.
 * @param lock - the whole lock.
 * @example
 * writeItemsLock("/repo", { lockfileVersion: 1, items: {} });
 */
export function writeItemsLock(root: string, lock: ItemsLock): void {
  const checked = ITEMS_LOCK_SCHEMA.parse(lock);
  const items = Object.fromEntries(
    Object.entries(checked.items).sort(([left], [right]) => left.localeCompare(right)),
  );
  writeFileSync(
    join(root, ITEMS_LOCK_FILE),
    `# Written by \`stackra add\`; do not edit.\n${stringify({ lockfileVersion: 1, items })}`,
  );
}
