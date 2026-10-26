/**
 * Stackra file contract:
 * Purpose: `dependencyPath`, the declared-package lookup discovery shares: the first `node_modules/<dependency>/<path>`
 *          that exists, searched from the member root upward, so a dependency's committed manifest and its lang
 *          catalogues are found the same way (STA-1298).
 * Boundary: reads the file system only (existence checks); writes nothing.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 25: a dependency's facts come from what it ships); STA-1298.
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Where `path` inside `dependency` is, or undefined when no `node_modules` from `root` up has it.
 *
 * @param root - the member root.
 * @param dependency - the dependency package name.
 * @param path - the path inside the package folder.
 * @example
 * dependencyPath("/repo/services/customers", "@stackra/loyalty-kit", "assets/lang");
 */
export function dependencyPath(root: string, dependency: string, path: string): string | undefined {
  for (let directory = root; ; directory = dirname(directory)) {
    const candidate = join(directory, "node_modules", dependency, path);
    if (existsSync(candidate)) return candidate;
    if (dirname(directory) === directory) return undefined;
  }
}
