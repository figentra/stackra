/**
 * Stackra file contract:
 * Purpose: `presetTemplateKey(root, preset)`, the `LAYOUT_TEMPLATES` key of flow.config.json's `preset`: a name
 *          (`neutral`, `stackra`, `@stackra/flow-preset`) is its own key; a repository folder (`./…`, which Flow takes
 *          as a preset since STA-2097) is the `preset.id` its `preset.yml` declares, when that id is a template.
 * Boundary: reads `<root>/<preset>/preset.yml` only for a `./` or `../` preset. A folder without the file, or whose id
 *           is no template, keeps its path, so `checkRepositoryLayout` still refuses it as having no template.
 * Runtime: node
 * Governing contract: ADR 0528 (decision 1: each preset's template); ADR 0526 (decision 4).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parse } from "yaml";

import { LAYOUT_TEMPLATES } from "#node/constants/layout-templates.constant";

/**
 * The template key of a preset.
 *
 * @param root - the repository root.
 * @param preset - flow.config.json's `preset`.
 * @example
 * presetTemplateKey(root, "./packages/developer/flow-preset/preset"); // "stackra"
 */
export function presetTemplateKey(root: string, preset: string): string {
  if (!/^\.\.?\//.test(preset)) return preset;
  const file = join(root, preset, "preset.yml");
  if (!existsSync(file)) return preset;
  const id = (parse(readFileSync(file, "utf8")) as { preset?: { id?: unknown } } | null)?.preset
    ?.id;
  return typeof id === "string" && Object.hasOwn(LAYOUT_TEMPLATES, id) ? id : preset;
}
