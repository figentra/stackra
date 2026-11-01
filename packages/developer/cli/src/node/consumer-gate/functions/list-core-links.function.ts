/**
 * Stackra file contract:
 * Purpose: `listCoreLinks(core)`, every `@stackra/*` package under `<core>/packages/<category>/<name>` as
 *          `{ "<name>": "link:<absolute path>" }`, the rows a consumer's workspace is rewritten with.
 * Boundary: reads package manifests under `<core>/packages`; skips `node_modules` and dot folders; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The core packages as pnpm `link:` specifiers.
 *
 * @param core - the core tree root.
 * @example
 * listCoreLinks("/core"); // { "@stackra/model": "link:/core/packages/data/model", ... }
 */
export function listCoreLinks(core: string): Record<string, string> {
  const links: Record<string, string> = {};
  const walk = (dir: string, depth: number): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === "node_modules" || entry.name.startsWith(".")) {
        continue;
      }
      const path = join(dir, entry.name);
      const manifest = join(path, "package.json");
      if (existsSync(manifest)) {
        const name = (JSON.parse(readFileSync(manifest, "utf8")) as { name?: string }).name;
        if (name?.startsWith("@stackra/")) links[name] = `link:${path}`;
      } else if (depth < 2) {
        walk(path, depth + 1);
      }
    }
  };
  walk(join(core, "packages"), 0);
  return links;
}
