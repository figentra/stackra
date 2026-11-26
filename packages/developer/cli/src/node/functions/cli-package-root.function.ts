/**
 * Stackra file contract:
 * Purpose: `cliPackageRoot()`, the folder of the installed `@stackra/cli` (the one holding its package.json): where
 *          `cliVersion` reads the version and the scaffold finds the templates the build ships.
 * Boundary: reads package.json files only, walking up from this module, so it works from `src/` and from `dist/`
 *           alike.
 * Runtime: node
 * Governing contract: ADR 0177 (decision 5: one fixed `@stackra/*` version); ADR 0282 (decision 5).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The `@stackra/cli` package folder.
 *
 * @param from - the folder the search starts in; this module's folder by default.
 * @throws Error when no `@stackra/cli` package.json sits at or above `from` (a broken install).
 * @example
 * cliPackageRoot(); // "/app/node_modules/@stackra/cli"
 */
export function cliPackageRoot(from: string = dirname(fileURLToPath(import.meta.url))): string {
  for (let folder = from; ; folder = dirname(folder)) {
    const file = join(folder, "package.json");
    if (existsSync(file)) {
      const manifest = JSON.parse(readFileSync(file, "utf8")) as { name?: unknown };
      if (manifest.name === "@stackra/cli") return folder;
    }
    if (dirname(folder) === folder)
      throw new Error("no @stackra/cli package.json above the binary");
  }
}
