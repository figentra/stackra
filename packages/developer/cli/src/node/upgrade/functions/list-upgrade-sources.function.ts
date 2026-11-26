/**
 * Stackra file contract:
 * Purpose: `listUpgradeSources(root)`, every TypeScript and JavaScript file of a workspace the source codemods read,
 *          relative to the root with `/` separators, sorted.
 * Boundary: reads folders only. Never walks into a dot folder (`.git`, `.stackra`, `.turbo`, …) or a folder of
 *           `UPGRADE_SKIPPED_FOLDERS` (installs, build output, gen's Encore services), and never follows a symbolic
 *           link, so a linked package's source is its own repository's to upgrade.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145.
 */
import { readdirSync } from "node:fs";
import { extname, join } from "node:path";

import { UPGRADE_SKIPPED_FOLDERS } from "#node/upgrade/constants/upgrade-skipped-folders.constant";
import { UPGRADE_SOURCE_EXTENSIONS } from "#node/upgrade/constants/upgrade-source-extensions.constant";

/**
 * The source files under `root`.
 *
 * @example
 * listUpgradeSources("/repo"); // ["packages/app/src/index.ts", "services/orders/src/orders.service.ts"]
 */
export function listUpgradeSources(root: string): readonly string[] {
  const files: string[] = [];
  const walk = (folder: string): void => {
    for (const entry of readdirSync(join(root, folder), { withFileTypes: true })) {
      const path = folder === "" ? entry.name : `${folder}/${entry.name}`;
      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".") && !UPGRADE_SKIPPED_FOLDERS.has(entry.name)) walk(path);
      } else if (entry.isFile() && UPGRADE_SOURCE_EXTENSIONS.includes(extname(entry.name)))
        files.push(path);
    }
  };
  walk("");
  return files.toSorted();
}
