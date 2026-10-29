/**
 * Stackra file contract:
 * Purpose: `loadSearchRunner(cwd)`, the member's search runner: `searchReindex` from its own
 *          `@stackra/data-maintenance/node` (the add-on that holds the reindex jobs, ADR 0462 decision 1) and
 *          `searchStatus` from its own `@stackra/search/node`, each imported dynamically from the member's folder when
 *          it is first called, so `search:status` needs no add-on.
 * Boundary: resolves from `cwd`, so the member's installed versions run; the CLI bundles no search code. Fails with a
 *           message that names the fix when the member lacks the package or its entry has no such runner.
 * Runtime: node
 * Governing contract: ADR 0404 (decision 3); ADR 0221 (decision 7); ADR 0282 (decision 3); ADR 0462 (decision 1).
 */
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import type { SearchRunner } from "#node/types/search-runner.type";

/** Imports the function `name` of `pkg/node` as the member at `cwd` resolves it. */
async function runnerOf<K extends keyof SearchRunner>(
  cwd: string,
  pkg: string,
  name: K,
): Promise<SearchRunner[K]> {
  let file: string;
  try {
    file = createRequire(join(cwd, "package.json")).resolve(`${pkg}/node`);
  } catch {
    throw new Error(`${cwd} does not resolve ${pkg}/node: add ${pkg} to its dependencies`);
  }
  const loaded = (await import(pathToFileURL(file).href)) as Partial<SearchRunner>;
  const runner = loaded[name];
  if (typeof runner !== "function")
    throw new Error(`${pkg}/node exports no ${name}: update ${pkg}`);
  return runner as SearchRunner[K];
}

/**
 * Loads the search runner from the member at `cwd`.
 *
 * @param cwd - the member root.
 * @example
 * const runner = await loadSearchRunner("/repo/services/commerce");
 */
export async function loadSearchRunner(cwd: string): Promise<SearchRunner> {
  return {
    searchReindex: async (options) =>
      (await runnerOf(cwd, "@stackra/data-maintenance", "searchReindex"))(options),
    searchStatus: async () => (await runnerOf(cwd, "@stackra/search", "searchStatus"))(),
  };
}
