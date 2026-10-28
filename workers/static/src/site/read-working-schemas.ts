/**
 * Stackra file contract:
 * Purpose: read the JSON Schemas as they are in the working tree (tools/schemas), the source of the moving paths.
 * Boundary: reads files under the given root; writes nothing and parses nothing (plan-site.ts validates).
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files, decision 2).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { SCHEMAS_DIR } from "#src/constants";
import type { SchemaSource } from "#src/interfaces";

/**
 * Read every `*.schema.json` directly inside tools/schemas, sorted by name so the build is deterministic.
 *
 * @param root - absolute path of the repository root.
 * @returns the schema files; empty when the folder does not exist yet (before STA-305 lands), so the site still
 *   builds with an empty `/index.json`.
 */
export function readWorkingSchemas(root: string): SchemaSource[] {
  const dir = join(root, SCHEMAS_DIR);
  if (!existsSync(dir)) return [];
  return (
    readdirSync(dir)
      .filter((name) => name.endsWith(".schema.json"))
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort()
      .map((name) => ({
        file: `${SCHEMAS_DIR}/${name}`,
        text: readFileSync(join(dir, name), "utf8"),
      }))
  );
}
