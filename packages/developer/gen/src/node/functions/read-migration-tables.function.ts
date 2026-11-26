/**
 * Stackra file contract:
 * Purpose: `readMigrationTables`, every `schema.create`/`schema.table` block of a member's own migrations, with its
 *          table, its module, its file and whether it gives the table its owner policy: `t.belongsToTenant(...)` (either
 *          form: the bare call or `{ nullable: true }`, BelongsToTenantOrPlatform's), or `t.rowLevelSecurity("tenant_id",
 *          …)`, which the macro compiles to and a package that cannot depend on @stackra/tenancy writes itself (outbox,
 *          queue, scheduler, settings at their contract step). So `checkModelScope` can refuse an owned model whose
 *          table never gets the owner column and policy.
 * Boundary: a text scan over `migrationFilesOf`, in apply order. A block runs from its `schema.create`/`schema.table`
 *           to the next one in its file; migrations are frozen literals (ADR 0159), so the call is read as written. A
 *           raw table rename (`schema.sql('alter table "m"."old" rename to "new"'`, the blueprint has none) is a block
 *           of the new name that keeps the old table's tenant column; its `inverse` is not read.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended by ADR 0305: literal snapshots); ADR 0239 (decision 1); ADR 0210
 *                     (2026-10-24 amendment).
 */
import { readFileSync } from "node:fs";
import { relative } from "node:path";

import type { MemberIR } from "#core/types/member-ir.type";
import { migrationFilesOf } from "#node/functions/migration-files-of.function";

/** A table a migration creates or alters: `schema.create("products"`, `schema.table('products'`. */
/** A block's owner policy: the tenancy macro, or the `tenant_id` policy it compiles to, written directly. */
const OWNER_POLICY = /\.belongsToTenant\(|\.rowLevelSecurity\(\s*["']tenant_id["']/;

const TABLE = /\bschema\.(?:create|table)\(\s*["'`]([A-Za-z_][\w]*)["'`]/g;

/** A column a block adds through a Blueprint column method, with the method: `t.jsonb("closed_on")`. */
const COLUMN =
  /\.(string|integer|bigint|decimal|boolean|timestamp|uuid|jsonb|tsvector|point|polygon|line|enum|link)\(\s*["'`]([a-z_][a-z0-9_]*)["'`]/g;

/** The columns `block` adds, each with the Blueprint method that adds it. */
const columnsOf = (block: string): { name: string; method: string }[] =>
  [...block.matchAll(COLUMN)].map((match) => ({ name: match[2] ?? "", method: match[1] ?? "" }));

/** A raw table rename as a `schema.sql` statement: `schema.sql('alter table "ai"."steps" rename to "run_steps"'`. */
const RENAME =
  /\bschema\.sql\(\s*["'`]alter table\s+(?:"?\w+"?\.)?"?(\w+)"?\s+rename to\s+"?(\w+)"?/gi;

/**
 * The migration table blocks of the member at `root`.
 *
 * @param root - the member root.
 * @param layout - the member's layout: a service's migrations sit per module, a package's under `src/node`.
 * @param member - the member key, a package migration's module.
 * @example
 * readMigrationTables("packages/application/ai", "package", "ai")[0];
 * // { file: "src/node/database/migrations/0001-create-ai-tables.migration.ts", module: "ai", table: "conversations", ownerColumn: true, columns: […] }
 */
export function readMigrationTables(
  root: string,
  layout: MemberIR["layout"],
  member: string,
): NonNullable<MemberIR["migrationTables"]> {
  const found: {
    file: string;
    module: string;
    table: string;
    ownerColumn: boolean;
    columns: { name: string; method: string }[];
  }[] = [];
  for (const { module, path } of migrationFilesOf(root, layout, member)) {
    const text = readFileSync(path, "utf8");
    const file = relative(root, path);
    const tables = [...text.matchAll(TABLE)];
    const events = [
      ...tables.map((match, index) => ({
        at: match.index ?? 0,
        table: match[1] ?? "",
        ownerColumn: (): boolean =>
          OWNER_POLICY.test(text.slice(match.index ?? 0, tables[index + 1]?.index ?? text.length)),
        columns: columnsOf(text.slice(match.index ?? 0, tables[index + 1]?.index ?? text.length)),
      })),
      ...[...text.matchAll(RENAME)].map((match) => ({
        at: match.index ?? 0,
        table: match[2] ?? "",
        ownerColumn: (): boolean =>
          found.some(
            (block) => block.module === module && block.table === match[1] && block.ownerColumn,
          ),
        columns: [],
      })),
    ]
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort((left, right) => left.at - right.at);
    for (const event of events)
      found.push({
        file,
        module,
        table: event.table,
        ownerColumn: event.ownerColumn(),
        columns: event.columns,
      });
  }
  return found;
}
