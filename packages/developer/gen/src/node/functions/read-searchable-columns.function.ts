/**
 * Stackra file contract:
 * Purpose: `readSearchableColumns`, the `t.searchable({ text, filters })` literals of a member's own migrations, each
 *          with its table, its module and the file that holds it, in apply order, so `checkSearchableDrift` can
 *          compare the latest call per table with the model's `@Searchable` facet.
 * Boundary: a text scan: a service's `src/modules/<folder>/database/migrations/*.migration.ts` (module: the folder's
 *           key) and a package's `src/node/database/migrations/*.migration.ts` (module: the member key), files in
 *           name order (`NNNN-`). A call belongs to the nearest `schema.create`/`schema.table` before it in its file.
 *           Migrations are frozen literals (ADR 0159), so a string array is read as written; a call whose `text` is
 *           no literal array is left out.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended by ADR 0305: macros, literal snapshots); ADR 0221 (decisions 1 and 3);
 *                     data-layer gap se10 (`searchable_columns_drift`).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { folderKey } from "#core/functions/folder-key.function";
import type { MemberIR } from "#core/types/member-ir.type";

/** A table a migration creates or alters: `schema.create("products"`, `schema.table('products'`. */
const TABLE = /\bschema\.(?:create|table)\(\s*["'`]([A-Za-z_][\w]*)["'`]/g;

/** The start of a `t.searchable({` call. */
const CALL = /\.searchable\(\s*\{/g;

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

/** The object literal opening at `start` (a `{`), up to its matching brace. */
function objectAt(text: string, start: number): string {
  let depth = 0;
  for (let at = start; at < text.length; at += 1) {
    if (text[at] === "{") depth += 1;
    if (text[at] === "}") depth -= 1;
    if (depth === 0) return text.slice(start, at + 1);
  }
  return text.slice(start);
}

/** The strings of the array literal under `key` in `object`, or undefined when it has none. */
function stringsOf(object: string, key: string): string[] | undefined {
  const array = new RegExp(`\\b${key}\\s*:\\s*\\[([^\\]]*)\\]`).exec(object)?.[1];
  return array === undefined
    ? undefined
    : [...array.matchAll(/["'`]([^"'`]+)["'`]/g)].map((match) => match[1] ?? "");
}

/** The `version` number literal of `object`, as a spreadable field, or none. */
function versionOf(object: string): { version?: number } {
  const version = /\bversion\s*:\s*(\d+)/.exec(object)?.[1];
  return version === undefined ? {} : { version: Number(version) };
}

/**
 * The `t.searchable` calls in the member at `root`.
 *
 * @param root - the member root.
 * @param layout - the member's layout: a service's migrations sit per module, a package's under `src/node`.
 * @param member - the member key, a package migration's module.
 * @example
 * readSearchableColumns("packages/commerce/loyalty-kit", "package", "loyalty_kit")[0];
 * // { file: "src/node/database/migrations/0001-create-loyalty-tables.migration.ts", module: "loyalty_kit", table: "loyalty_accounts", text: ["member_id"], filters: ["tier", "is_frozen", "created_at"] }
 */
export function readSearchableColumns(
  root: string,
  layout: MemberIR["layout"],
  member: string,
): NonNullable<MemberIR["searchableColumns"]> {
  const modules =
    layout === "service"
      ? (existsSync(join(root, "src/modules"))
          ? readdirSync(join(root, "src/modules"), { withFileTypes: true })
          : []
        )
          .filter((entry) => entry.isDirectory())
          .map((entry) => ({
            module: folderKey(entry.name),
            dir: join(root, "src/modules", entry.name, "database/migrations"),
          }))
      : [{ module: member, dir: join(root, "src/node/database/migrations") }];
  const found: {
    file: string;
    module: string;
    table: string;
    text: string[];
    filters: string[];
    version?: number;
  }[] = [];
  for (const { module, dir } of modules)
    for (const path of migrationsOf(dir)) {
      const text = readFileSync(path, "utf8");
      const tables = [...text.matchAll(TABLE)];
      for (const call of text.matchAll(CALL)) {
        const at = call.index ?? 0;
        let table: string | undefined;
        for (const each of tables) if ((each.index ?? 0) < at) table = each[1];
        const object = objectAt(text, at + call[0].length - 1);
        const fields = stringsOf(object, "text");
        if (table === undefined || fields === undefined) continue;
        found.push({
          file: relative(root, path),
          module,
          table,
          text: fields,
          filters: stringsOf(object, "filters") ?? [],
          ...versionOf(object),
        });
      }
    }
  return found;
}
