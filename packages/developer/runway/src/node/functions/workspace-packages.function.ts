/**
 * Stackra file contract:
 * Purpose: `workspacePackages(repository)`, the packages under a product repository's `packages/` tree by name (three
 *          levels down, never node_modules or a dot folder), with each one's folder, version and exports.
 * Boundary: reads package.json files only.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 2).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import type { WorkspacePackage } from "#node/types/workspace-package.type";

/**
 * The product's packages by name.
 *
 * @example
 * workspacePackages("/repo").get("@figentra/acme-example")?.version; // "0.1.0"
 */
export function workspacePackages(
  repository: string,
  folder = join(repository, "packages"),
  depth = 3,
  found = new Map<string, WorkspacePackage>(),
): Map<string, WorkspacePackage> {
  if (depth < 0 || !existsSync(folder)) return found;
  const file = join(folder, "package.json");
  if (existsSync(file)) {
    const manifest = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
    if (typeof manifest["name"] === "string")
      found.set(manifest["name"], {
        dir: resolve(folder),
        version: typeof manifest["version"] === "string" ? manifest["version"] : "0.0.0",
        exports: (manifest["exports"] ?? {}) as Record<string, unknown>,
      });
  }
  for (const entry of readdirSync(folder, { withFileTypes: true }))
    if (entry.isDirectory() && entry.name !== "node_modules" && !entry.name.startsWith("."))
      workspacePackages(repository, join(folder, entry.name), depth - 1, found);
  return found;
}
