/**
 * Stackra file contract:
 * Purpose: `checkMigrationDrift`, `stackra db diff` for one member: discovers it, compiles and orders its migrations (its
 *          own and its declared packages', the order gen writes to `.stackra/migrations`), replays them on an in-memory
 *          PGlite through the member's own `@stackra/database/node` (`readMigratedSchema`), builds the schema its models
 *          declare (`expectedSchema`) and returns their differences.
 * Boundary: no database, no network, no secret: the replay database is in process and thrown away. gen holds no
 *           database driver; it imports the member's `@stackra/database/node`, resolved from the member root. A
 *           member that is not a service, or has no models and no migrations, is not compared. Discovery, compile and
 *           ordering refusals come back as `errors`; a replay that fails, a missing `@stackra/database` or a missing
 *           PGlite throws an `Error` with the fix. Writes nothing.
 * Runtime: node
 * Governing contract: ADR 0159 (decisions 1 to 3); ADR 0282 (decision 3: `stackra db diff`); ADR 0014 (only
 *                     `@stackra/database` holds the database driver); STA-1808.
 */
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { diffSchemas } from "#core/functions/diff-schemas.function";
import { expectedSchema } from "#core/functions/expected-schema.function";
import type { SchemaSnapshot } from "#core/types/schema-snapshot.type";
import { compileMigrations } from "#node/functions/compile-migrations.function";
import { discoverMember } from "#node/functions/discover-member.function";
import type { MigrationDrift } from "#node/types/migration-drift.type";

/** The part of `@stackra/database/node` this calls. */
interface DatabaseNode {
  readonly readMigratedSchema?: (
    files: readonly {
      readonly name: string;
      readonly sql: string;
      readonly transactional: boolean;
    }[],
    schemas: readonly string[],
  ) => Promise<SchemaSnapshot>;
}

/** The header a step the runner applies outside a transaction opens with. */
const NON_TRANSACTIONAL = "-- stackra:transactional=false";

/** The migrated schema of `files`, read by the member's own database package. */
async function replay(
  root: string,
  files: readonly {
    readonly name: string;
    readonly sql: string;
    readonly transactional: boolean;
  }[],
  schemas: readonly string[],
): Promise<SchemaSnapshot> {
  let entry: string;
  try {
    entry = createRequire(join(root, "package.json")).resolve("@stackra/database/node");
  } catch (error) {
    throw new Error(
      `${root} does not resolve @stackra/database/node, which replays the migrations: add @stackra/database to its dependencies`,
      { cause: error },
    );
  }
  const database = (await import(pathToFileURL(entry).href)) as DatabaseNode;
  if (typeof database.readMigratedSchema !== "function")
    throw new TypeError(
      "@stackra/database/node exports no readMigratedSchema: update @stackra/database",
    );
  return database.readMigratedSchema(files, schemas);
}

/**
 * Compares the models of the member at `root` with the migrations it replays to.
 *
 * @param root - the member root.
 * @param options - `backend` picks the TypeScript host, as `discoverMember` does.
 * @throws Error when a migration fails to replay, or `@stackra/database` or PGlite is missing.
 * @example
 * const { differences } = await checkMigrationDrift("services/invoicing");
 * differences.map((each) => each.kind); // []
 */
export async function checkMigrationDrift(
  root: string,
  options: { readonly backend?: "tsgo" | "ts6" } = {},
): Promise<MigrationDrift> {
  const ir = await discoverMember(
    root,
    options.backend === undefined ? {} : { backend: options.backend },
  );
  if (ir.errors.length > 0)
    return { member: ir.member, differences: [], errors: ir.errors, compared: false };
  if (ir.layout !== "service")
    return { member: ir.member, differences: [], errors: [], compared: false };

  const compiled = await compileMigrations(root, ir);
  if (compiled.errors.length > 0)
    return { member: ir.member, differences: [], errors: compiled.errors, compared: false };

  const expected = expectedSchema(ir);
  const files = compiled.files
    .filter((file) => file.path.endsWith(".up.sql"))
    .map((file) => ({
      name: file.path.slice(file.path.lastIndexOf("/") + 1).replace(/\.up\.sql$/, ""),
      sql: file.content,
      transactional: !file.content.startsWith(NON_TRANSACTIONAL),
    }));
  if (files.length === 0 && expected.columns.length === 0)
    return { member: ir.member, differences: [], errors: [], compared: false };

  const actual =
    files.length === 0
      ? { columns: [], indexes: [], foreignKeys: [] }
      : await replay(root, files, ir.modules);
  return {
    member: ir.member,
    differences: diffSchemas(expected, actual, ir.modules),
    errors: [],
    compared: true,
  };
}
