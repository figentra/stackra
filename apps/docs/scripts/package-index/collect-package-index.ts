/**
 * Stackra file contract:
 * Purpose: `collectPackageIndex` reads every `packages/<category>/<name>/package.json` of the repository and keeps
 *          the published ones (`private` not `true`) as `PackageIndexRecord`s for the customer package index.
 * Boundary: reads package.json files only. A package.json that is not valid JSON, or a published package with no
 *           `stackra.summary`, fails the run with its path, so a row is never written with an empty "Use it for".
 * Runtime: node
 * Governing contract: ADR 0453 (amendment 2026-10-27: the stackra package fields); STA-2847.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { PackageIndexRecord } from "#scripts/package-index/package-index-record";

/** The repository root (the folder holding `packages/`), four levels above this file. */
const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

/** The `package.json` fields the index reads. */
interface PackageJson {
  readonly name?: string;
  readonly private?: boolean;
  readonly exports?: Record<string, unknown> | string;
  readonly bin?: Record<string, string> | string;
  readonly stackra?: { readonly summary?: string };
}

/** The import entries of a package: its `exports` keys without `./package.json`; `.` for a string export. */
function entriesOf(manifest: PackageJson): string[] {
  if (typeof manifest.exports === "string") return ["."];
  if (manifest.exports === undefined) return [];
  return Object.keys(manifest.exports).filter((entry) => entry !== "./package.json");
}

/** The commands a package installs: its `bin` keys, or its unscoped name for a string `bin`. */
function commandsOf(manifest: PackageJson, name: string): string[] {
  if (typeof manifest.bin === "string") return [name.split("/").pop() ?? name];
  return manifest.bin === undefined ? [] : Object.keys(manifest.bin);
}

/**
 * Reads the published packages under `<root>/packages/<category>/<name>/package.json`.
 *
 * @param root - the repository root; defaults to this repository.
 * @returns one record per published package, in folder order.
 * @throws Error naming the file when a package.json is not valid JSON or a published package has no summary.
 * @example
 * collectPackageIndex().length; // 119
 */
export function collectPackageIndex(root: string = REPOSITORY_ROOT): PackageIndexRecord[] {
  const packagesDir = join(root, "packages");
  const records: PackageIndexRecord[] = [];
  for (const category of readdirSync(packagesDir).toSorted()) {
    const categoryDir = join(packagesDir, category);
    if (!statSync(categoryDir).isDirectory()) continue;
    for (const folder of readdirSync(categoryDir).toSorted()) {
      const file = join(categoryDir, folder, "package.json");
      if (!existsSync(file)) continue;
      let manifest: PackageJson;
      try {
        manifest = JSON.parse(readFileSync(file, "utf8")) as PackageJson;
      } catch (error) {
        throw new Error(`${file} is not valid JSON: ${(error as Error).message}`, { cause: error });
      }
      const { name } = manifest;
      if (manifest.private === true || name === undefined) continue;
      const summary = manifest.stackra?.summary?.trim();
      if (summary === undefined || summary === "")
        throw new Error(`${file} has no stackra.summary: the package index needs one for ${name}`);
      records.push({
        name,
        category,
        folder,
        summary,
        entries: entriesOf(manifest),
        commands: commandsOf(manifest, name),
      });
    }
  }
  return records;
}
