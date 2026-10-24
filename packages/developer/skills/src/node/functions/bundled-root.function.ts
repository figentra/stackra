/**
 * Stackra file contract:
 * Purpose: `bundledRoot`, the absolute path of the `assets/` folder this package ships: found by walking up from this
 *          module to the nearest `package.json`, so it holds from `src/` in the workspace and from `dist/` once
 *          published.
 * Boundary: internal; the default root of `loadSkillSet`. Reads the file system only to find the package root.
 * Runtime: node
 * Governing contract: ADR 0282 (decisions 2 and 6).
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The package's `assets/` folder.
 *
 * @param from - the module URL to start from; defaults to this module.
 * @throws Error when no `package.json` sits above `from`.
 * @example
 * bundledRoot(); // "/…/node_modules/@stackra/skills/assets"
 */
export function bundledRoot(from: string = import.meta.url): string {
  let directory = dirname(fileURLToPath(from));
  while (!existsSync(join(directory, "package.json"))) {
    const parent = dirname(directory);
    if (parent === directory) throw new Error(`No package.json above ${fileURLToPath(from)}`);
    directory = parent;
  }
  return join(directory, "assets");
}
