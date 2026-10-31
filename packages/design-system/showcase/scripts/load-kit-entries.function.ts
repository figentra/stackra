/**
 * Stackra file contract:
 * Purpose: `loadKitEntries`, the registry entries module UI kits declare: every
 *          `packages/<category>/<name>/showcase/<slug>.json` outside the design system, each naming its own package.
 * Boundary: reads JSON only and imports no kit code, so the showcase never depends on a module package (ADR 0003); the
 *           shape is checked by the registry gate (`checkRegistry`), the owning package here.
 * Runtime: node
 * Governing contract: ADR 0504 (module UI kits: gen aggregates them into the showcase).
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import type { ComponentEntry } from "../src/types/component-entry.type.ts";
import type { LoadedEntry } from "./loaded-entry.type.ts";

/** Every kit entry under `<root>/packages`, sorted by package path then file; `module` is absent (the barrel inlines it). */
export function loadKitEntries(root: string): LoadedEntry[] {
  const loaded: LoadedEntry[] = [];
  const packages = join(root, "packages");
  for (const category of readdirSync(packages).toSorted()) {
    if (category === "design-system" || !statSync(join(packages, category)).isDirectory()) continue;
    for (const name of readdirSync(join(packages, category)).toSorted()) {
      const dir = join(packages, category, name, "showcase");
      if (!existsSync(dir)) continue;
      const { name: packageName } = JSON.parse(
        readFileSync(join(packages, category, name, "package.json"), "utf8"),
      ) as { readonly name: string };
      for (const file of readdirSync(dir)
        .filter((json) => json.endsWith(".json"))
        .toSorted()) {
        const entry = JSON.parse(readFileSync(join(dir, file), "utf8")) as ComponentEntry;
        const where = `${category}/${name}/showcase/${file}`;
        if (entry.packageName !== packageName)
          throw new Error(`${where}: packageName must be ${packageName}, the kit's own package`);
        if (`${entry.slug}.json` !== file)
          throw new Error(`${where}: file must be ${entry.slug}.json`);
        loaded.push({ constant: `KIT_${entry.slug.replaceAll("-", "_").toUpperCase()}`, entry });
      }
    }
  }
  return loaded;
}
