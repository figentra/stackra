/**
 * Stackra file contract:
 * Purpose: `publishedPackages`, the names of the published `@stackra/*` packages of this repository: every
 *          `packages/<category>/<name>/package.json` that is not private.
 * Boundary: reads package.json files only.
 * Runtime: node
 * Governing contract: ADR 0001 (packages/<category>/<name>); ADR 0453 (decision 18); STA-2865.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Lists the published package names under a packages folder.
 *
 * @param packagesRoot - the repository's `packages` folder.
 * @returns the names of the packages whose `package.json` is not private.
 * @example
 * publishedPackages("/repo/packages").has("@stackra/ai"); // true
 */
export function publishedPackages(packagesRoot: string): Set<string> {
  const names = new Set<string>();
  for (const category of readdirSync(packagesRoot, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    for (const member of readdirSync(join(packagesRoot, category.name), { withFileTypes: true })) {
      const manifest = join(packagesRoot, category.name, member.name, "package.json");
      if (!member.isDirectory() || !existsSync(manifest)) continue;
      const { name, private: isPrivate } = JSON.parse(readFileSync(manifest, "utf8")) as {
        name?: string;
        private?: boolean;
      };
      if (name !== undefined && isPrivate !== true) names.add(name);
    }
  }
  return names;
}
