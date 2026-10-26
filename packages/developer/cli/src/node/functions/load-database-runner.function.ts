/**
 * Stackra file contract:
 * Purpose: `loadDatabaseRunner(cwd)`, the member's database runner: its own `@stackra/database/node`, imported
 *          dynamically from the member's folder.
 * Boundary: resolves from `cwd`, so the member's installed version runs; the CLI bundles nothing of MikroORM. Fails
 *           with a message that names the fix when the member has no `@stackra/database` or its entry has no runner.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 2 as amended: `stackra db migrate`); ADR 0282 (decision 3).
 */
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import type { DatabaseRunner } from "#node/types/database-runner.type";

/**
 * Whether `dir` or a parent holds `node_modules/@stackra/database`. Checked first because `require.resolve` also
 * searches NODE_PATH, which pnpm's bin shims set to the workspace's hoisted store, so a member without the package
 * would otherwise load the CLI's copy.
 */
const installed = (dir: string): boolean =>
  existsSync(join(dir, "node_modules", "@stackra", "database")) ||
  (dirname(dir) !== dir && installed(dirname(dir)));

/**
 * Loads the runner from the member at `cwd`.
 *
 * @param cwd - the member root.
 * @throws Error when the member cannot resolve `@stackra/database/node` or it exports no migrate and rollback.
 * @example
 * await (await loadDatabaseRunner("apps/api")).migrate({ cwd: "apps/api", environment: "staging" });
 */
export async function loadDatabaseRunner(cwd: string): Promise<DatabaseRunner> {
  let file: string;
  try {
    if (!installed(resolve(cwd))) throw new Error("not installed");
    file = createRequire(join(cwd, "package.json")).resolve("@stackra/database/node");
  } catch {
    throw new Error(
      `${cwd} does not resolve @stackra/database/node: add @stackra/database to its dependencies`,
    );
  }
  const loaded = (await import(pathToFileURL(file).href)) as Partial<DatabaseRunner>;
  if (typeof loaded.migrate !== "function" || typeof loaded.rollback !== "function") {
    throw new Error(
      "@stackra/database/node exports no migrate and rollback: update @stackra/database",
    );
  }
  return { migrate: loaded.migrate, rollback: loaded.rollback };
}
