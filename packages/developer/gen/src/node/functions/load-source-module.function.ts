/**
 * Stackra file contract:
 * Purpose: `loadSourceModule(root, path)`, imports a TypeScript source file for gen. A file outside `node_modules` (the
 *          member's own, or a workspace package linked there) loads directly, since Node 24 strips its types. A file
 *          under `node_modules` (a package installed from the registry, which ships `src/`) is one Node refuses to
 *          strip, so its types are stripped here into `<root>/.stackra/cache/sources/` and that copy loads instead.
 * Boundary: reads the file and writes one cache copy beside the member's other generated files; the copy resolves its
 *           bare imports from the member root, so a migration's `@stackra/database` is the member's own instance.
 *           Relative imports in such a file do not resolve from the copy (a package migration imports only
 *           `@stackra/database`, ADR 0159).
 * Runtime: node
 * Governing contract: ADR 0159 (decision 2: a migration imports only @stackra/database); ADR 0421.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { basename, join, sep } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Imports the source module at `path` for the member at `root`.
 *
 * @example
 * const exported = await loadSourceModule("services/sales", "node_modules/@stackra/ai/src/node/database/migrations/0001-create-ai-tables.migration.ts");
 */
export async function loadSourceModule(
  root: string,
  path: string,
): Promise<Record<string, unknown>> {
  const real = realpathSync(path);
  if (!real.split(sep).includes("node_modules") || !real.endsWith(".ts"))
    return (await import(pathToFileURL(real).href)) as Record<string, unknown>;
  const code = stripTypeScriptTypes(readFileSync(real, "utf8"), { mode: "strip" });
  const digest = createHash("sha256").update(real).update(code).digest("hex").slice(0, 16);
  const dir = join(root, ".stackra", "cache", "sources");
  mkdirSync(dir, { recursive: true });
  const copy = join(dir, `${basename(real, ".ts")}.${digest}.mjs`);
  writeFileSync(copy, code);
  return (await import(pathToFileURL(copy).href)) as Record<string, unknown>;
}
