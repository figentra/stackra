/**
 * Stackra file contract:
 * Purpose: `listCorePacks(core)`, the publishable core packages: every non-private `@stackra/*` package under
 *          `<core>/packages/<category>/<name>`, the set `release.yml` builds (`--filter=./packages/**`) and
 *          publishes, as `{ name, version, dir }`.
 * Boundary: reads package manifests under `<core>/packages`; skips `node_modules` and dot folders; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); release workflow; STA-1813.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { ConsumerGateCorePack } from "#node/consumer-gate/types/consumer-gate-core-pack.type";

type Manifest = { name?: string; version?: string; private?: boolean };

/**
 * Lists the packages to pack.
 *
 * @param core - the core tree root.
 * @example
 * listCorePacks("/core"); // [{ name: "@stackra/model", version: "0.3.0", dir: "/core/packages/data/model" }]
 */
export function listCorePacks(core: string): ConsumerGateCorePack[] {
  const found: ConsumerGateCorePack[] = [];
  const walk = (dir: string, depth: number): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === "node_modules" || entry.name.startsWith(".")) {
        continue;
      }
      const path = join(dir, entry.name);
      const file = join(path, "package.json");
      if (existsSync(file)) {
        const manifest = JSON.parse(readFileSync(file, "utf8")) as Manifest;
        if (manifest.name?.startsWith("@stackra/") && manifest.private !== true) {
          found.push({ name: manifest.name, version: manifest.version ?? "0.0.0", dir: path });
        }
      } else if (depth < 2) {
        walk(path, depth + 1);
      }
    }
  };
  walk(join(core, "packages"), 0);
  return found.toSorted((a, b) => a.name.localeCompare(b.name));
}
