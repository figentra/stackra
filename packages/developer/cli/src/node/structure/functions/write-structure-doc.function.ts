/**
 * Stackra file contract:
 * Purpose: `writeStructureDoc(path)`, writes the generated standards page (`renderStructureDoc`) to `path`, creating
 *          its folder (moved from `tools/scripts/structure.mjs`).
 * Boundary: writes the one page.
 * Runtime: node
 * Governing contract: ADR 0294; ADR 0269.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { renderStructureDoc } from "#node/structure/functions/render-structure-doc.function";

/**
 * Writes the page and returns the path written.
 *
 * @param path - where the page goes: apps/docs/src/docs/standards/structure.mdx in core.
 * @example
 * writeStructureDoc(join(root, "apps/docs/src/docs/standards/structure.mdx"));
 */
export function writeStructureDoc(path: string): string {
  if (!existsSync(dirname(path))) mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, renderStructureDoc());
  return path;
}
