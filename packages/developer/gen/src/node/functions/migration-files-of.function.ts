/**
 * Stackra file contract:
 * Purpose: `migrationFilesOf`, a member's own migration files with their module, in apply order, for the readers
 *          that scan migration literals (`readSearchableColumns`, `readMigrationTables`).
 * Boundary: a directory scan: a service's `src/modules/<folder>/database/migrations/*.migration.ts` (module: the
 *           folder's key) and a package's `src/node/database/migrations/*.migration.ts` (module: the member key),
 *           files in name order (`NNNN-`). A missing directory gives none.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended by ADR 0305: literal snapshots); ADR 0294 (decision 20).
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { folderKey } from "#core/functions/folder-key.function";
import { isModuleFolder } from "#core/functions/is-module-folder.function";
import type { MemberIR } from "#core/types/member-ir.type";

/** The `.migration.ts` files of `directory`, sorted, or none when it does not exist. */
function migrationsOf(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return (
    readdirSync(directory)
      .filter((name) => name.endsWith(".migration.ts"))
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort()
      .map((name) => join(directory, name))
  );
}

/**
 * The migration files of the member at `root`, each with its module.
 *
 * @param root - the member root.
 * @param layout - the member's layout: a service's migrations sit per module, a package's under `src/node`.
 * @param member - the member key, a package migration's module.
 * @example
 * migrationFilesOf("packages/commerce/loyalty-kit", "package", "loyalty_kit")[0];
 * // { module: "loyalty_kit", path: "packages/commerce/loyalty-kit/src/node/database/migrations/0001-create-loyalty-tables.migration.ts" }
 */
export function migrationFilesOf(
  root: string,
  layout: MemberIR["layout"],
  member: string,
): { readonly module: string; readonly path: string }[] {
  const modules =
    layout === "service"
      ? (existsSync(join(root, "src/modules"))
          ? readdirSync(join(root, "src/modules"), { withFileTypes: true })
          : []
        )
          .filter((entry) => entry.isDirectory() && isModuleFolder(entry.name))
          .map((entry) => ({
            module: folderKey(entry.name),
            dir: join(root, "src/modules", entry.name, "database/migrations"),
          }))
      : [{ module: member, dir: join(root, "src/node/database/migrations") }];
  return modules.flatMap(({ module, dir }) => migrationsOf(dir).map((path) => ({ module, path })));
}
