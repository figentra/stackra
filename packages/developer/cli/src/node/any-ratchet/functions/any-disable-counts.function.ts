/**
 * Stackra file contract:
 * Purpose: `anyDisableCounts(root)`, the `oxlint-disable` and `eslint-disable` comments that name `no-explicit-any`,
 *          counted per package under `packages/` (moved from `tools/scripts/any-ratchet.mjs`).
 * Boundary: reads the source files (`.ts`, `.tsx`, `.mts`, `.cts`, `.js`, `.mjs`, `.cjs`; `node_modules`, `dist`,
 *           `coverage` and `.turbo` skipped) of every member under `packages/`; writes nothing.
 * Runtime: node
 * Governing contract: rule-gap list N-5 (owner D11, 2026-10-28); STA-1388; ADR 0129.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { readManifestMembers } from "#node/functions/read-workspace-members.function";
import { sorted } from "#node/functions/sorted.function";

/** A disable directive that names `no-explicit-any` (any plugin prefix), up to the end of its line. */
const ANY_DISABLE = /(?:oxlint|eslint)-disable(?:-next-line|-line)?\s[^\n]*no-explicit-any/g;

/** Every source file under `dir`, skipping dependencies and build output. */
function sourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory())
      return ["node_modules", "dist", "coverage", ".turbo"].includes(entry.name)
        ? []
        : sourceFiles(path);
    return /\.(?:[cm]?ts|tsx|[cm]?js)$/.test(entry.name) ? [path] : [];
  });
}

/**
 * The `no-explicit-any` disable count of each package that has one: package directory to count, sorted.
 *
 * @param root - the workspace root.
 * @example
 * anyDisableCounts(root).get("packages/data/model"); // 1
 */
export function anyDisableCounts(root: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const { dir } of readManifestMembers(root)) {
    if (!dir.startsWith("packages/")) continue;
    let count = 0;
    for (const path of sourceFiles(join(root, dir)))
      count += readFileSync(path, "utf8").match(ANY_DISABLE)?.length ?? 0;
    if (count > 0) counts.set(dir, count);
  }
  return new Map(sorted(counts, ([a], [b]) => (a < b ? -1 : 1)));
}
