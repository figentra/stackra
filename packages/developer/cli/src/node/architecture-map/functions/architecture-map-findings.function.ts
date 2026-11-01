/**
 * Stackra file contract:
 * Purpose: `architectureMapFindings(root)`, the architecture map drift check of `pnpm validate`: one finding when the
 *          committed candidate is missing, is the placeholder, or differs from what the generator writes now. Compares
 *          the parsed YAML, so oxfmt's layout of the file never counts (moved from
 *          `tools/scripts/architecture-map.mjs`).
 * Boundary: reads the workspace and the committed candidate; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0452; STA-1373.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";

import { parse } from "yaml";

import { MAP_COMMAND } from "#node/architecture-map/constants/map-command.constant";
import { MAP_OUTPUT } from "#node/architecture-map/constants/map-output.constant";
import { MAP_SOURCE } from "#node/architecture-map/constants/map-source.constant";
import { readArchitectureInputs } from "#node/architecture-map/functions/read-architecture-inputs.function";
import { renderArchitectureMap } from "#node/architecture-map/functions/render-architecture-map.function";
import type { DirFinding } from "#node/types/dir-finding.type";

/**
 * The drift findings of the workspace at `root`.
 *
 * @param root - the workspace root.
 * @example
 * architectureMapFindings(root); // [] when the committed map is current
 */
export function architectureMapFindings(root: string): DirFinding[] {
  const path = join(root, MAP_SOURCE);
  const expected = renderArchitectureMap(readArchitectureInputs(root));
  let committed: unknown;
  try {
    committed = parse(readFileSync(path, "utf8"));
  } catch {
    committed = undefined;
  }
  if (isDeepStrictEqual(committed, expected)) return [];
  return [
    {
      dir: "apps/docs",
      text: `${MAP_SOURCE} is out of date (or the placeholder): run \`${MAP_COMMAND}\` and commit the map and ${MAP_OUTPUT}`,
    },
  ];
}
