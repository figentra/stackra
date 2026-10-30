/**
 * Stackra file contract:
 * Purpose: `listPropsFiles`, every component props file of @stackra/ui, sorted, with the `*.returns.ts`
 *          files that type a hook's return value.
 * Boundary: reads directory listings only.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import type { PropsFile } from "./props-file.type.ts";

/** Every `<ds>/ui/src/{react,native}/<slug>/*.props.ts`, sorted by package, platform, slug, file. */
export function listPropsFiles(ds: string): PropsFile[] {
  const out: PropsFile[] = [];
  for (const pkg of ["ui"] as const) {
    for (const platform of ["react", "native"] as const) {
      const root = join(ds, pkg, "src", platform);
      if (!existsSync(root)) continue;
      for (const slug of readdirSync(root).toSorted()) {
        const dir = join(root, slug);
        if (!statSync(dir).isDirectory()) continue;
        for (const name of readdirSync(dir).toSorted()) {
          if (name.endsWith(".props.ts") || name.endsWith(".returns.ts"))
            out.push({ pkg, platform, slug, file: join(dir, name) });
        }
      }
    }
  }
  return out;
}
