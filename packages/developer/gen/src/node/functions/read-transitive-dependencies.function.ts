/**
 * Stackra file contract:
 * Purpose: `readTransitiveDependencies`, the undeclared `@stackra/*` packages the declared packages' manifests wire
 *          from, followed until nothing new appears, each with the packages its own manifest wires from: how gen
 *          refuses the whole missing set in one run, not one layer per run.
 * Boundary: reads files only. Each package is resolved from the real folder of the package that brought it in (pnpm
 *           links a package's own dependencies beside it, not into the member). A package whose manifest cannot be
 *           resolved or read is listed without descending. Nothing found here is ever hosted.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 25: a dependency's facts come from its manifest); ADR 0003.
 */
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";

import type { StackraManifest } from "@stackra/contracts";

import { manifestPackages } from "#core/functions/manifest-packages.function";
import type { MemberIR } from "#core/types/member-ir.type";
import { dependencyPath } from "#node/functions/dependency-path.function";

/** A package's real folder, resolved from `from`, or undefined when it is not installed there. */
function folderOf(from: string, name: string): string | undefined {
  const path = dependencyPath(from, name, "package.json");
  return path === undefined ? undefined : dirname(realpathSync(path));
}

/**
 * The undeclared packages reachable from `dependencies`' manifests.
 *
 * @param root - the member root.
 * @param dependencies - the declared packages with their manifests.
 * @param declared - every package name the member declares.
 * @example
 * readTransitiveDependencies(root, ir.dependencies, ir.packages ?? []); // [{ package: "@stackra/scope", requires: [] }]
 */
export function readTransitiveDependencies(
  root: string,
  dependencies: MemberIR["dependencies"],
  declared: readonly string[],
): { package: string; requires: string[] }[] {
  const known = new Set(declared);
  const found: { package: string; requires: string[] }[] = [];
  const queue: { from: string; names: string[] }[] = [];
  for (const { package: name, manifest } of dependencies) {
    const from = folderOf(root, name);
    if (from !== undefined) queue.push({ from, names: manifestPackages(manifest) });
  }
  for (let next = queue.shift(); next !== undefined; next = queue.shift())
    for (const name of next.names) {
      if (known.has(name)) continue;
      known.add(name);
      const folder = folderOf(next.from, name);
      let requires: string[] = [];
      const path = folder === undefined ? undefined : join(folder, "stackra.manifest.json");
      if (folder !== undefined && path !== undefined && existsSync(path))
        try {
          requires = manifestPackages(JSON.parse(readFileSync(path, "utf8")) as StackraManifest);
        } catch {
          // An unreadable manifest is reported as is, without descending.
        }
      found.push({ package: name, requires });
      if (folder !== undefined && requires.length > 0)
        queue.push({ from: folder, names: requires });
    }
  return found;
}
