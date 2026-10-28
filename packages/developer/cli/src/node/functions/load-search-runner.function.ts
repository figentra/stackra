/**
 * Stackra file contract:
 * Purpose: `loadSearchRunner(cwd)`, the member's search runner: `searchReindex` and `searchStatus` from its own
 *          `@stackra/search/node`, imported dynamically from the member's folder.
 * Boundary: resolves from `cwd`, so the member's installed version runs; the CLI bundles no search code. Fails with a
 *           message that names the fix when the member has no `@stackra/search` or its entry has no runner.
 * Runtime: node
 * Governing contract: ADR 0404 (decision 3); ADR 0221 (decision 7); ADR 0282 (decision 3).
 */
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import type { SearchRunner } from "#node/types/search-runner.type";

/**
 * Loads the search runner from the member at `cwd`.
 *
 * @param cwd - the member root.
 * @throws Error when the member cannot resolve `@stackra/search/node` or it exports no searchReindex and searchStatus.
 * @example
 * const runner = await loadSearchRunner("/repo/services/commerce");
 */
export async function loadSearchRunner(cwd: string): Promise<SearchRunner> {
  let file: string;
  try {
    file = createRequire(join(cwd, "package.json")).resolve("@stackra/search/node");
  } catch {
    throw new Error(
      `${cwd} does not resolve @stackra/search/node: add @stackra/search to its dependencies`,
    );
  }
  const loaded = (await import(pathToFileURL(file).href)) as Partial<SearchRunner>;
  if (typeof loaded.searchReindex !== "function" || typeof loaded.searchStatus !== "function")
    throw new Error(
      "@stackra/search/node exports no searchReindex and searchStatus: update @stackra/search",
    );
  return { searchReindex: loaded.searchReindex, searchStatus: loaded.searchStatus };
}
