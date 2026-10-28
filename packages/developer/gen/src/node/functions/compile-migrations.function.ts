/**
 * Stackra file contract:
 * Purpose: `compileMigrations`, the node half of the migration target: finds a service's own migrations
 *          (`src/modules/<key>/database/migrations/NNNN-<name>.migration.ts`) and those its declared packages ship
 *          (`src/node/database/migrations/`), compiles each with the member's own `@stackra/database`
 *          `compileMigration` (macros: the member's `database/macros/*.macro.ts` and every `Macro` a declared package
 *          exports from its `./node` entry), orders them across members (`orderMigrations`, `Migration({ after })`
 *          resolved there) and returns the `.stackra/migrations` files (`emitMigrations`).
 * Boundary: imports the migration and macro files (Node 24 strips their types) and the member's `@stackra/database`,
 *           resolved from the member root so the migration classes and the compiler share one kind registry. Writes
 *           nothing; `generate` writes or checks the files. A migration that does not load or compile is refused
 *           (`migration_load_failed`, `migration_compile_failed`); so is a member with migrations and no
 *           `@stackra/database` (`migration_database_missing`). No migration anywhere: no files and no import.
 * Runtime: node
 * Governing contract: ADR 0159 (decisions 1 to 3, as amended 2026-10-23 and 2026-10-24); ADR 0294 (decision 20: a
 *                     Postgres schema per module).
 */
import { existsSync, readdirSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";

import { emitMigrations } from "#core/functions/emit-migrations.function";
import { folderKey } from "#core/functions/folder-key.function";
import { migrationId } from "#core/functions/migration-id.function";
import { orderMigrations } from "#core/functions/order-migrations.function";
import type { GenError } from "#core/types/gen-error.type";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { MigrationUnit } from "#core/types/migration-unit.type";
import { dependencyPath } from "#node/functions/dependency-path.function";

/** The part of `@stackra/database` the target calls. */
interface DatabaseEntry {
  readonly compileMigration: (
    type: unknown,
    options: {
      readonly schema: string;
      readonly createsSchema?: boolean;
      readonly macros?: readonly unknown[];
    },
  ) => { readonly after: readonly string[]; readonly steps: MigrationUnit["steps"] };
  readonly Macro: abstract new () => unknown;
}

/** A migration file found on disk. */
interface FoundMigration {
  readonly id: string;
  readonly module: string;
  readonly owner: MigrationUnit["owner"];
  readonly path: string;
  readonly file: string;
}

/** One whole-file refusal. */
const refusal = (
  code: string,
  file: string,
  subject: string,
  message: string,
  fix: string,
): GenError => ({
  code,
  file,
  line: 0,
  column: 0,
  subject,
  message,
  fix,
});

/** The files of `directory` matching `suffix`, sorted, or none when it does not exist. */
function filesOf(directory: string, suffix: string): string[] {
  if (!existsSync(directory)) return [];
  const names = readdirSync(directory).filter((name) => name.endsWith(suffix));
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  return names.sort();
}

/** The module folders of a service, each with its key. */
const modulesOf = (root: string): { readonly key: string; readonly dir: string }[] =>
  filesOf(join(root, "src/modules"), "").map((folder) => ({
    key: folderKey(folder),
    dir: join(root, "src/modules", folder),
  }));

/** Imports a file by its real path, so a workspace package linked under node_modules loads from its folder. */
const load = async (path: string): Promise<Record<string, unknown>> =>
  (await import(pathToFileURL(realpathSync(path)).href)) as Record<string, unknown>;

/**
 * Compiles and orders the migrations of the service at `root`.
 *
 * @param root - the member root.
 * @param ir - its discovered IR (`packages`: the declared dependencies).
 * @example
 * const { files, errors } = await compileMigrations("services/billing", ir);
 * files[0]?.path; // ".stackra/migrations/0001_search_0001_create_text_functions.up.sql"
 */
export async function compileMigrations(
  root: string,
  ir: MemberIR,
): Promise<{ readonly files: readonly GeneratedFile[]; readonly errors: readonly GenError[] }> {
  const found: FoundMigration[] = [];
  const macroFiles: string[] = [];
  const macroPackages: string[] = [];
  for (const module of modulesOf(root)) {
    const dir = join(module.dir, "database/migrations");
    for (const name of filesOf(dir, ".migration.ts")) {
      const id = migrationId(module.key, name);
      // A misnamed file is check-conventions' `migration_numbering` refusal.
      if (id !== undefined)
        found.push({
          id,
          module: module.key,
          owner: "member",
          path: join(dir, name),
          file: relative(root, join(dir, name)),
        });
    }
    const macros = join(module.dir, "database/macros");
    macroFiles.push(...filesOf(macros, ".macro.ts").map((name) => join(macros, name)));
  }
  for (const name of ir.packages ?? []) {
    const module = folderKey(name.slice(name.lastIndexOf("/") + 1));
    const dir = dependencyPath(root, name, "src/node/database/migrations");
    for (const file of dir === undefined ? [] : filesOf(dir, ".migration.ts")) {
      const id = migrationId(module, file);
      if (id !== undefined)
        found.push({
          id,
          module,
          owner: "package",
          path: join(dir as string, file),
          file: `${name}/src/node/database/migrations/${file}`,
        });
    }
    if (dependencyPath(root, name, "src/node/database/macros") !== undefined)
      macroPackages.push(name);
  }
  if (found.length === 0) return { files: [], errors: [] };

  const require = createRequire(join(root, "package.json"));
  let database: DatabaseEntry;
  try {
    database = (await load(require.resolve("@stackra/database"))) as unknown as DatabaseEntry;
  } catch {
    return {
      files: [],
      errors: [
        refusal(
          "migration_database_missing",
          "package.json",
          "@stackra/database",
          `${ir.member} has migrations but does not resolve @stackra/database, which compiles them`,
          "add @stackra/database to package.json dependencies",
        ),
      ],
    };
  }
  const errors: GenError[] = [];
  const isMacro = (value: unknown): boolean =>
    typeof value === "function" && value.prototype instanceof database.Macro;
  const macros: unknown[] = [];
  for (const path of macroFiles) {
    try {
      macros.push(...Object.values(await load(path)).filter(isMacro));
    } catch (error) {
      errors.push(
        refusal(
          "migration_load_failed",
          relative(root, path),
          path,
          `${relative(root, path)} does not load: ${String(error)}`,
          "fix the macro file so it imports only @stackra/database and its own types",
        ),
      );
    }
  }
  for (const name of macroPackages) {
    try {
      macros.push(...Object.values(await load(require.resolve(`${name}/node`))).filter(isMacro));
    } catch (error) {
      errors.push(
        refusal(
          "migration_load_failed",
          "package.json",
          name,
          `${name}/node does not load, so its macros are missing: ${String(error)}`,
          `build ${name} (its ./node entry), or remove it from dependencies`,
        ),
      );
    }
  }

  const units: MigrationUnit[] = [];
  for (const migration of found) {
    let exported: Record<string, unknown>;
    try {
      // shortcut: Node refuses to strip types under node_modules, so a package installed from the registry (not a
      // workspace link) does not load here; upgrade to compiling from the package's built output when one ships it.
      exported = await load(migration.path);
    } catch (error) {
      errors.push(
        refusal(
          "migration_load_failed",
          migration.file,
          migration.id,
          `${migration.file} does not load: ${String(error)}`,
          "a migration imports only @stackra/database and #stackra/migrations (ADR 0159); remove any other import",
        ),
      );
      continue;
    }
    const classes = Object.values(exported).filter((value) => typeof value === "function");
    if (classes.length !== 1) {
      errors.push(
        refusal(
          "migration_compile_failed",
          migration.file,
          migration.id,
          `${migration.file} exports ${classes.length} classes; a migration file exports exactly one`,
          "export the one Migration class and nothing else",
        ),
      );
      continue;
    }
    try {
      const compiled = database.compileMigration(classes[0], {
        schema: migration.module,
        createsSchema: migration.id.slice(migration.module.length + 1).startsWith("0001_"),
        macros,
      });
      units.push({
        id: migration.id,
        owner: migration.owner,
        file: migration.file,
        after: compiled.after,
        steps: compiled.steps,
      });
    } catch (error) {
      errors.push(
        refusal(
          "migration_compile_failed",
          migration.file,
          migration.id,
          `${migration.id} does not compile: ${error instanceof Error ? error.message : String(error)}`,
          "fix the migration as the message says; an applied migration is frozen, so fix it in a new one",
        ),
      );
    }
  }
  if (errors.length > 0) return { files: [], errors };
  const { ordered, errors: orderErrors } = orderMigrations(units);
  return orderErrors.length > 0
    ? { files: [], errors: orderErrors }
    : { files: emitMigrations(ordered), errors: [] };
}
