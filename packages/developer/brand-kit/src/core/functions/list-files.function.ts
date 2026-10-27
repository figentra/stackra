/**
 * Stackra file contract:
 * Purpose: `listFiles`, every file under a folder, relative and `/`-separated, sorted, skipping dot entries and
 *          `node_modules`; an absent folder lists nothing.
 * Boundary: reads the file system only.
 * Runtime: node
 * Governing contract: ADR 0441 (as amended: deterministic output).
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";

/**
 * The files under `dir`.
 *
 * @example
 * const files = await listFiles("assets/brand"); // ["README.md", "kit.json", "logos/app-icon/app-icon-light.svg"]
 */
export async function listFiles(dir: string, prefix = ""): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(join(dir, prefix), { withFileTypes: true });
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...(await listFiles(dir, rel)));
    else if (entry.isFile()) out.push(rel);
  }
  return out.sort();
}
