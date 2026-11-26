/**
 * Stackra file contract:
 * Purpose: `listPackages(root)`, every published package under `packages/<category>/<name>` read from its
 *          `package.json` (name, version, `stackra` category, summary and runtimes, `repository`, `exports`) into an
 *          `ApiPackage` with no symbols yet; `readPackageApis` fills those.
 * Boundary: reads `package.json` files; a `private` package is left out. An entry whose `@stackra/source` file is
 *           TypeScript is a `code` entry; every other entry (assets, JSON presets, plugins) is a `file` entry.
 * Runtime: node
 * Governing contract: ADR 0453 (amendment 2026-10-27: the stackra package fields); ADR 0294 (decision 15: the
 *                     `@stackra/source` condition); STA-2857.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { ApiEntry } from "#scripts/api-reference/api-entry.type";
import type { ApiPackage } from "#scripts/api-reference/api-package.type";

/** The fields of `package.json` the reference reads. */
interface Manifest {
  readonly name?: string;
  readonly version?: string;
  readonly private?: boolean;
  readonly exports?: unknown;
  readonly repository?: { readonly url?: string } | string;
  readonly stackra?: {
    readonly category?: string;
    readonly summary?: string;
    readonly runtimes?: readonly string[];
  };
}

/** A TypeScript source file an entry can map to. */
const TYPESCRIPT = /\.(?:ts|tsx|mts|cts)$/;

/** The file an `exports` value maps to: the `@stackra/source` condition first, then `default`, `import`, `types`. */
function targetOf(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value === null || typeof value !== "object") return undefined;
  const conditions = value as Record<string, unknown>;
  for (const key of ["@stackra/source", "default", "import", "types"]) {
    const found = targetOf(conditions[key]);
    if (found !== undefined) return found;
  }
  return undefined;
}

/** `.` first, then the other subpaths in code-unit order. */
function bySubpath(a: ApiEntry, b: ApiEntry): number {
  if (a.subpath === b.subpath) return 0;
  if (a.subpath === ".") return -1;
  if (b.subpath === ".") return 1;
  return a.subpath < b.subpath ? -1 : 1;
}

/** `git+https://github.com/o/r.git` as `https://github.com/o/r/tree/main/<dir>`. */
function sourceUrl(repository: Manifest["repository"], dir: string): string {
  const url = typeof repository === "string" ? repository : (repository?.url ?? "");
  const base = url.replace(/^git\+/, "").replace(/\.git$/, "");
  return base === "" ? "" : `${base}/tree/main/${dir}`;
}

/** The entries of `exports`; a package with a string or no `exports` has the one `.` entry. */
function entriesOf(manifest: Manifest): ApiEntry[] {
  const exportsField = manifest.exports;
  const map: Record<string, unknown> =
    exportsField === undefined
      ? {}
      : typeof exportsField === "string" ||
          !Object.keys(exportsField as object).some((key) => key.startsWith("."))
        ? { ".": exportsField }
        : (exportsField as Record<string, unknown>);
  const entries: ApiEntry[] = [];
  for (const [subpath, value] of Object.entries(map)) {
    const target = targetOf(value);
    if (target === undefined) continue;
    const code = TYPESCRIPT.test(target) && !target.includes("*") && !target.endsWith(".d.ts");
    entries.push({ subpath, kind: code ? "code" : "file", target, symbols: [] });
  }
  return entries.toSorted(bySubpath);
}

/**
 * Every published package of the repository, sorted by category then name.
 *
 * @param root - the repository root (absolute).
 * @returns one `ApiPackage` per non-private `packages/<category>/<name>/package.json`, with empty symbol lists.
 * @example
 * listPackages("/work/stackra").map((pkg) => pkg.name); // ["@stackra/achievements", …]
 */
export function listPackages(root: string): ApiPackage[] {
  const packages: ApiPackage[] = [];
  const packagesDir = join(root, "packages");
  for (const category of readdirSync(packagesDir, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    for (const member of readdirSync(join(packagesDir, category.name), { withFileTypes: true })) {
      if (!member.isDirectory()) continue;
      const dir = `packages/${category.name}/${member.name}`;
      const manifestPath = join(root, dir, "package.json");
      if (!existsSync(manifestPath)) continue;
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
      if (manifest.private === true || typeof manifest.name !== "string") continue;
      packages.push({
        name: manifest.name,
        version: manifest.version ?? "0.0.0",
        category: manifest.stackra?.category ?? category.name,
        summary: manifest.stackra?.summary ?? "",
        runtimes: manifest.stackra?.runtimes ?? [],
        dir,
        sourceUrl: sourceUrl(manifest.repository, dir),
        entries: entriesOf(manifest),
      });
    }
  }
  return packages.toSorted((a, b) =>
    a.category === b.category ? (a.name < b.name ? -1 : 1) : a.category < b.category ? -1 : 1,
  );
}
