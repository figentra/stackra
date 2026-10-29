/**
 * Stackra file contract:
 * Purpose: `surfaceEntries(root, packages, surface)`, the entry file of each product package for one surface: the
 *          package found by name under the product's `packages/` tree, and its `./<surface>` export (the
 *          `@stackra/source` condition first, else `default`, else a plain string target).
 * Boundary: reads package.json files under `<root>/packages` (three levels down, never node_modules); answers absolute
 *           paths in the order given.
 * Runtime: node
 * Governing contract: ADR 0436 (decisions 2 and 6: a product ships packages, local development runs the real shell);
 *                     ADR 0025 (the `@stackra/source` condition).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { CliUsageError } from "#node/errors/cli-usage.error";

/** The package.json files under `folder`, `depth` levels down. */
function manifestsUnder(folder: string, depth: number): string[] {
  if (depth < 0 || !existsSync(folder)) return [];
  const found = existsSync(join(folder, "package.json")) ? [join(folder, "package.json")] : [];
  for (const entry of readdirSync(folder, { withFileTypes: true }))
    if (entry.isDirectory() && entry.name !== "node_modules" && !entry.name.startsWith("."))
      found.push(...manifestsUnder(join(folder, entry.name), depth - 1));
  return found;
}

/** The file an export target names for source loading. */
function targetOf(target: unknown): string | undefined {
  if (typeof target === "string") return target;
  if (typeof target !== "object" || target === null) return undefined;
  const conditions = target as Record<string, unknown>;
  return targetOf(conditions["@stackra/source"] ?? conditions["default"]);
}

/**
 * The surface entries of `packages`.
 *
 * @throws CliUsageError naming a package the workspace lacks or one without a `./<surface>` export.
 * @example
 * surfaceEntries("/repo", ["@figentra/acme-example"], "console"); // ["/repo/packages/application/example/src/console.tsx"]
 */
export function surfaceEntries(
  root: string,
  packages: readonly string[],
  surface: string,
): string[] {
  const byName = new Map<string, { dir: string; exports: unknown }>();
  for (const file of manifestsUnder(join(root, "packages"), 3)) {
    const manifest = JSON.parse(readFileSync(file, "utf8")) as {
      name?: unknown;
      exports?: unknown;
    };
    if (typeof manifest.name === "string")
      byName.set(manifest.name, { dir: resolve(file, ".."), exports: manifest.exports });
  }
  return packages.map((name) => {
    const found = byName.get(name);
    if (found === undefined) throw new CliUsageError(`${name} is not a package under packages/`);
    const exports = (found.exports ?? {}) as Record<string, unknown>;
    const target = targetOf(exports[`./${surface}`]);
    if (target === undefined)
      throw new CliUsageError(`${name} has no ./${surface} export for the ${surface} surface`);
    return resolve(found.dir, target);
  });
}
