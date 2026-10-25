/**
 * Stackra file contract:
 * Purpose: `loadSeedRunner(cwd)`, the member's seed runner: `seedState` and `applySeed` from its own
 *          `@stackra/database/node`, imported dynamically from the member's folder.
 * Boundary: resolves from `cwd`, so the member's installed version runs; the CLI bundles no database driver. Fails
 *           with a message that names the fix when the member has no `@stackra/database` or its entry has no runner.
 * Runtime: node
 * Governing contract: ADR 0325 (decision 7); ADR 0190; ADR 0282 (decision 3: `stackra` runs every operation).
 */
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import type { SeedRunner } from "#node/types/seed-runner.type";

/**
 * Loads the seed runner from the member at `cwd`.
 *
 * @param cwd - the member root.
 * @throws Error when the member cannot resolve `@stackra/database/node` or it exports no seedState and applySeed.
 * @example
 * const runner = await loadSeedRunner("/repo/services/commerce");
 */
export async function loadSeedRunner(cwd: string): Promise<SeedRunner> {
  let file: string;
  try {
    file = createRequire(join(cwd, "package.json")).resolve("@stackra/database/node");
  } catch {
    throw new Error(
      `${cwd} does not resolve @stackra/database/node: add @stackra/database to its dependencies`,
    );
  }
  const loaded = (await import(pathToFileURL(file).href)) as Partial<SeedRunner>;
  if (typeof loaded.seedState !== "function" || typeof loaded.applySeed !== "function")
    throw new Error(
      "@stackra/database/node exports no seedState and applySeed: update @stackra/database",
    );
  return { seedState: loaded.seedState, applySeed: loaded.applySeed };
}
