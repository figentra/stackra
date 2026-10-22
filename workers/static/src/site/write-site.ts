/**
 * Stackra file contract:
 * Purpose: write the planned site files into the Workers assets folder, replacing whatever a previous build left.
 * Boundary: deletes and recreates only the given output folder; touches nothing else.
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files).
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { SiteFile } from "#src/interfaces";

/**
 * Empty `outDir` and write every file at its URL path below it. Emptying first matters: a stale file would be
 * uploaded and served even though no schema or tag produces it any more.
 *
 * @param outDir - absolute path of the assets folder (wrangler.jsonc `assets.directory`).
 * @param files - the planned files; each `path` starts with `/`.
 */
export function writeSite(outDir: string, files: readonly SiteFile[]): void {
  rmSync(outDir, { recursive: true, force: true });
  for (const file of files) {
    const target = join(outDir, file.path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, file.body);
  }
}
