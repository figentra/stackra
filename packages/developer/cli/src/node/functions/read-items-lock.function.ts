/**
 * Stackra file contract:
 * Purpose: `readItemsLock(root)`, the workspace's `stackra-items.lock.yaml`, checked by `ITEMS_LOCK_SCHEMA`; an empty
 *          lock when the file does not exist yet.
 * Boundary: reads one file; an invalid lock throws with the schema's issues rather than being overwritten.
 * Runtime: node
 * Governing contract: ADR 0453 (decision 11).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { ITEMS_LOCK_SCHEMA, type ItemsLock } from "@stackra/skills/contracts";
import { parse } from "yaml";

import { ITEMS_LOCK_FILE } from "#node/constants/items-lock-file.constant";

/**
 * The items lock of the workspace at `root`.
 *
 * @param root - the workspace root.
 * @example
 * readItemsLock("/repo").items["@stackra/skill-archify"]?.version;
 */
export function readItemsLock(root: string): ItemsLock {
  const file = join(root, ITEMS_LOCK_FILE);
  if (!existsSync(file)) return { lockfileVersion: 1, items: {} };
  return ITEMS_LOCK_SCHEMA.parse(parse(readFileSync(file, "utf8")));
}
