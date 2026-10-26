/**
 * Stackra file contract:
 * Purpose: `loadMemberSchemas`, which imports every generated schema file of the member under test
 *          (`.stackra/gen/schemas/<module>.ts`, reached in source as `#stackra/schemas/<module>`), so each file's
 *          `registerSchemas` call runs before a test validates or creates a shape (`X has no registered schema`).
 * Boundary: imports by file path from the member root (the working directory vitest runs in), because a `#stackra/*`
 *           import resolves against the importing package, never the member's. A member that has not run
 *           `stackra gen` has no schema folder and loads nothing. Each root loads once per test process.
 *           `compile()` calls it; a setup file may await it so a test file's top-level `X.create(...)` finds its schema.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0294 (decision 26: the shape compiler); registry v3.1 gap G1.
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { LOADED_SCHEMAS } from "#testing/constants/loaded-schemas.constant";

/** Imports each schema file of the member at `root`, in file-name order; nothing when it has none. */
async function load(root: string): Promise<void> {
  const folder = join(root, ".stackra", "gen", "schemas");
  let files: string[];
  try {
    files = await readdir(folder);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
  for (const file of files.filter((name) => name.endsWith(".ts")).sort())
    await import(/* @vite-ignore */ pathToFileURL(join(folder, file)).href);
}

/**
 * Registers the generated schemas of the member at `root` (the working directory by default).
 *
 * @example
 * await loadMemberSchemas(); // in a vitest setup file, before any test file loads
 */
export function loadMemberSchemas(root: string = process.cwd()): Promise<void> {
  let loading = LOADED_SCHEMAS.get(root);
  if (loading === undefined) {
    loading = load(root);
    LOADED_SCHEMAS.set(root, loading);
  }
  return loading;
}
