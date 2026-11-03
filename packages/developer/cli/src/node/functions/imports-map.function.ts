/**
 * Stackra file contract:
 * Purpose: `importsMap(dir)`, the generated `imports` map of a member folder (ADR 0233 decision 1): `#src/*` and
 *          `#src/*.function` when `src/` holds a file directly, otherwise one `#<folder>/*` per `src/` folder but
 *          `__tests__` (dot entries such as `.DS_Store` are ignored); then `#plugin/*` for a root `plugin/`, `#scripts/*` (`./scripts/*.ts` only, plain Node scripts)
 *          for a root `scripts/`, and gen's `#stackra/*`. `stackra new` writes it and `stackra validate --repository`
 *          compares every member's map with it (STA-2072).
 * Boundary: reads the folder names of `dir`, `dir/src`, `dir/plugin` and `dir/scripts`; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0233 (decisions 1 and 6); ADR 0006 (rule 5); ADR 0294 (decision 15).
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { sorted } from "#node/functions/sorted.function";

/** An alias's targets: the path, then the extension fallbacks `bundler` resolution needs (ADR 0233). */
const aliasOf = (path: string): string[] => [
  `./${path}/*`,
  `./${path}/*.ts`,
  `./${path}/*.tsx`,
  `./${path}/*/index.ts`,
];

/**
 * The `imports` map a member folder's folders imply, its keys in a fixed order (src aliases sorted, then plugin,
 * scripts and stackra).
 *
 * @param dir - the member folder, absolute.
 * @example
 * importsMap("/repo/packages/data/cache"); // { "#core/*": [...], "#node/*": [...], "#stackra/*": [...] }
 */
export function importsMap(dir: string): Record<string, string | string[]> {
  const src = join(dir, "src");
  // Dot entries (.DS_Store, editor folders) are not code and never decide the layout.
  const entries = existsSync(src)
    ? readdirSync(src, { withFileTypes: true }).filter((entry) => !entry.name.startsWith("."))
    : [];
  // A file directly in src/ (main.ts, a root module) cannot be reached by a per-folder alias.
  const map: Record<string, string | string[]> = entries.some((entry) => entry.isFile())
    ? { "#src/*.function": "./src/*.function.ts", "#src/*": aliasOf("src") }
    : Object.fromEntries(
        sorted(
          entries
            .filter((entry) => entry.isDirectory() && entry.name !== "__tests__")
            .map((entry) => entry.name),
        ).map((name) => [`#${name}/*`, aliasOf(`src/${name}`)]),
      );
  if (existsSync(join(dir, "plugin"))) map["#plugin/*"] = aliasOf("plugin");
  // Node tries only the first target, and these scripts run under plain Node.
  if (existsSync(join(dir, "scripts"))) map["#scripts/*"] = "./scripts/*.ts";
  map["#stackra/*"] = aliasOf(".stackra/gen");
  return map;
}
