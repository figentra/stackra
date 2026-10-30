/**
 * Stackra file contract:
 * Purpose: `loadEntries`, import every registry entry file (`src/registry/components/<tier>/<slug>.ts`).
 * Boundary: imports the data-only entry modules (gen.ts resolves their `#src/*` imports).
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2.
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import type { ComponentEntry } from "../src/types/component-entry.type.ts";
import type { LoadedEntry } from "./loaded-entry.type.ts";

/** Every entry under `showcase/src/registry/components` (core has the free tier only), by file name. */
export async function loadEntries(showcase: string): Promise<LoadedEntry[]> {
  const loaded: LoadedEntry[] = [];
  for (const tier of ["free"]) {
    const dir = join(showcase, "src/registry/components", tier);
    for (const file of readdirSync(dir)
      .filter((name) => name.endsWith(".ts"))
      .toSorted()) {
      const exports = (await import(pathToFileURL(join(dir, file)).href)) as Record<
        string,
        ComponentEntry
      >;
      const [constant, entry] = Object.entries(exports)[0] ?? [];
      if (!constant || !entry) throw new Error(`${tier}/${file}: exports no entry`);
      loaded.push({
        constant,
        module: `#src/registry/components/${tier}/${file.replace(/\.ts$/, "")}`,
        entry,
      });
    }
  }
  return loaded;
}
