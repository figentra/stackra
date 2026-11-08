/**
 * Stackra file contract:
 * Purpose: `duplicateExports(root)`, each exported value or type name (`export function|const|let|var|class|interface|
 *          type|enum|namespace`) declared in the `src/` of more than one workspace package, with one row per package (its
 *          first file). A re-export declares nothing and never counts (moved from `tools/scripts/duplicate-exports.mjs`).
 * Boundary: reads pnpm-workspace.yaml and the `src/` files (`.ts`, `.tsx`, `.mts`; `__tests__/`, `.d.ts` and
 *           `.template.ts` skipped: a template's exports are the text it emits) of every member under `packages/`;
 *           writes nothing.
 * Runtime: node
 * Governing contract: ADR 0305 (one declaration per file, one home per concept); stackra-224 (STA-1382).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { readManifestMembers } from "#node/functions/read-workspace-members.function";
import { sorted } from "#node/functions/sorted.function";

/** One exported declaration: the keyword form, then the name (group 1). */
const DECLARATION =
  /^export\s+(?:declare\s+)?(?:default\s+)?(?:abstract\s+)?(?:async\s+)?(?:const\s+enum|function\*?|const|let|var|class|interface|type|enum|namespace)\s+([A-Za-z_$][\w$]*)/gm;

/** Every source file under `dir`, skipping tests, declaration files and build output. */
function sourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory())
      return ["__tests__", "node_modules", "dist"].includes(entry.name) ? [] : sourceFiles(path);
    // A `.template.ts` file is one constant of emitted source; its `export` lines belong to the file it writes.
    return /\.(ts|tsx|mts)$/.test(entry.name) && !/\.(d|template)\.ts$/.test(entry.name)
      ? [path]
      : [];
  });
}

/**
 * Each exported name declared in more than one package, names and rows in a stable order.
 *
 * @param root - the workspace root.
 * @example
 * duplicateExports(root).get("escapeHtml"); // [{ name: "@stackra/documents", file: "packages/data/..." }, ...]
 */
export function duplicateExports(
  root: string,
): Map<string, { readonly name: string; readonly file: string }[]> {
  const homes = new Map<string, Map<string, string>>();
  for (const { dir, name } of readManifestMembers(root)) {
    if (!dir.startsWith("packages/")) continue;
    for (const path of sorted(sourceFiles(join(root, dir, "src")))) {
      for (const [, exported = ""] of readFileSync(path, "utf8").matchAll(DECLARATION)) {
        const rows = homes.get(exported) ?? new Map<string, string>();
        if (!rows.has(name)) rows.set(name, path.slice(root.length).replace(/^[/\\]/, ""));
        homes.set(exported, rows);
      }
    }
  }
  return new Map(
    sorted(
      [...homes].filter(([, rows]) => rows.size > 1),
      ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0),
    ).map(([exported, rows]) => [
      exported,
      sorted(rows, ([a], [b]) => (a < b ? -1 : 1)).map(([pkg, file]) => ({ name: pkg, file })),
    ]),
  );
}
