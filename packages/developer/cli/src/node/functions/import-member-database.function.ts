/**
 * Stackra file contract:
 * Purpose: `importMemberDatabase(cwd)`, the member's own `@stackra/database/node` module, imported from the member's
 *          folder at run time: what `loadDatabaseRunner` and `loadDatabaseInspector` take their functions from.
 * Boundary: resolves from `cwd`, so the member's installed version runs; the CLI bundles nothing of MikroORM. Fails
 *           with a message that names the fix when the member has no `@stackra/database`.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 2 as amended: `stackra db migrate`); ADR 0282 (decision 3); STA-2906.
 */
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Whether `dir` or a parent holds `node_modules/@stackra/database`. Checked first because `require.resolve` also
 * searches NODE_PATH, which pnpm's bin shims set to the workspace's hoisted store, so a member without the package
 * would otherwise load the CLI's copy.
 */
const installed = (dir: string): boolean =>
  existsSync(join(dir, "node_modules", "@stackra", "database")) ||
  (dirname(dir) !== dir && installed(dirname(dir)));

/**
 * The member's `@stackra/database/node` exports.
 *
 * @param cwd - the member root.
 * @throws Error when the member cannot resolve `@stackra/database/node`.
 * @example
 * const { migrate } = await importMemberDatabase("services/notes");
 */
export async function importMemberDatabase(
  cwd: string,
): Promise<Readonly<Record<string, unknown>>> {
  let file: string;
  try {
    if (!installed(resolve(cwd))) throw new Error("not installed");
    file = createRequire(join(cwd, "package.json")).resolve("@stackra/database/node");
  } catch {
    throw new Error(
      `${cwd} does not resolve @stackra/database/node: add @stackra/database to its dependencies`,
    );
  }
  return (await import(pathToFileURL(file).href)) as Readonly<Record<string, unknown>>;
}
