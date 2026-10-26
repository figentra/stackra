/**
 * Stackra file contract:
 * Purpose: `listFiles(dir)`, every file under a folder, relative with `/` separators and sorted, skipping
 *          `node_modules` and dot-folders and dot-files.
 * Boundary: reads the folder tree only; follows no symbolic link out of it (links are skipped).
 * Runtime: node
 * Governing contract: ADR 0441 (decision 4); ported from figentra/os `tools/brand-kit/kit.mjs` (ORIGIN.md).
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * The files under `dir`.
 *
 * @example
 * listFiles("assets/brand"); // ["README.md", "kit.json", "marks/symbol.svg", …]
 */
export function listFiles(dir: string, prefix = ""): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(join(dir, prefix), { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const path = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) out.push(...listFiles(dir, path));
    else if (entry.isFile()) out.push(path);
  }
  return out.sort();
}
