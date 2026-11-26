/**
 * Stackra file contract:
 * Purpose: `readPackageApis(root, packages)`, the packages with the exported symbols of each `code` entry filled in,
 *          read by one `ApiReader` over every entry file.
 * Boundary: reads source files through `ApiReader`; writes nothing. A `code` entry whose file is missing is an error
 *           (the package's `exports` points nowhere).
 * Runtime: node
 * Governing contract: ADR 0007 (docblock standard); STA-2857.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import type { ApiPackage } from "#scripts/api-reference/api-package.type";
import { ApiReader } from "#scripts/api-reference/api.reader";

/**
 * The packages with their symbols.
 *
 * @param root - the repository root (absolute).
 * @param packages - the packages from `listPackages`.
 * @returns the same packages, each `code` entry carrying its exported symbols.
 * @throws Error when a `code` entry's file does not exist.
 * @example
 * readPackageApis(root, listPackages(root))[0]?.entries[0]?.symbols.length;
 */
export function readPackageApis(root: string, packages: readonly ApiPackage[]): ApiPackage[] {
  const files: string[] = [];
  for (const pkg of packages) {
    for (const entry of pkg.entries) {
      if (entry.kind !== "code") continue;
      const file = join(root, pkg.dir, entry.target);
      if (!existsSync(file)) {
        throw new Error(
          `api-reference: ${pkg.name} exports "${entry.subpath}" from ${entry.target}, which does not exist`,
        );
      }
      files.push(file);
    }
  }
  const reader = new ApiReader(files);
  return packages.map((pkg) => ({
    ...pkg,
    entries: pkg.entries.map((entry) =>
      entry.kind === "code"
        ? { ...entry, symbols: reader.read(join(root, pkg.dir, entry.target), join(root, pkg.dir)) }
        : entry,
    ),
  }));
}
