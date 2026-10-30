/**
 * Stackra file contract:
 * Purpose: `genNativeSources`: for every mobile demo `apps/mobile/src/demos/<slug>/<id>.tsx`, the sibling
 *          `<id>.code.ts` that exports its source text (Metro has no `?raw` import, so the Usage tab reads this).
 * Boundary: pure; gen.ts writes (or checks) what it returns. No demos folder yet = nothing to write.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2 step 7 and section 7.3.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { codeModule } from "./code-module.function.ts";

/** Output path (relative to `root`) -> content, for every demo `.tsx` under `demos`. */
export function genNativeSources(root: string, demos: string): Map<string, string> {
  const files = new Map<string, string>();
  if (!existsSync(demos)) return files;
  for (const file of readdirSync(demos, { recursive: true, encoding: "utf8" }).toSorted()) {
    if (!file.endsWith(".tsx") || file.includes("__tests__")) continue;
    const path = join(demos, file);
    files.set(
      relative(root, path.replace(/\.tsx$/, ".code.ts")),
      codeModule(file, readFileSync(path, "utf8")),
    );
  }
  return files;
}
