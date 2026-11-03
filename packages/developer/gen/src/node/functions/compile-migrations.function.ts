/**
 * Stackra file contract:
 * Purpose: `compileMigrations`, the node half of the migration target: finds a service's own migrations
 *          (`src/modules/<key>/database/migrations/NNNN-<name>.migration.ts`), a package's own
 *          (`src/node/database/migrations/`, for its migration check, STA-1689) and those its declared packages ship
 *          (`src/node/database/migrations/`), compiles each with the member's own `@stackra/database`
 *          `compileMigration` (macros: the member's `database/macros/*.macro.ts` and every `Macro` a declared package
 *          exports from its `./node` entry, recognised by `isMacroClass` whichever peer copy of `@stackra/database` it
 *          extends, STA-2006; a compile error from a macro no one supplied names those collected, `macroHint`), orders them across members (`orderMigrations`, `Migration({ after })`
 *          resolved there; `needs`: a module's dependencies and the owners of the macros a migration calls, recorded while
 *          it compiles) and returns the `.stackra/migrations` files (`emitMigrations`), plus, for a service with own
 *          macros, `.stackra/gen/blueprint.ts` (`emitBlueprintMacros`).
 * Boundary: imports the migration and macro files (Node 24 strips their types; `loadSourceModule` strips those of a
 *           package installed from the registry into `.stackra/cache`) and the member's `@stackra/database`, resolved
 *           from the member root so the migration classes and the compiler share one kind registry. Writes nothing
 *           else; `generate` writes or checks the files. A migration that does not load or compile is refused
 *           (`migration_load_failed`, `migration_compile_failed`); so is a member with migrations and no
 *           `@stackra/database` (`migration_database_missing`), and an own `AppendOnly` model whose table no migration
 *           revokes `UPDATE` on (`append_only_not_revoked`, `checkAppendOnly`). No migration anywhere: no files and no import.
 * Runtime: node
 * Governing contract: ADR 0159 (decisions 1 to 3, as amended 2026-10-23 and 2026-10-24); ADR 0294 (decision 20: a
 *                     Postgres schema per module); ADR 0220 and data-layer gap db5 (the append-only revoke, stackra-256).
 */
import { existsSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";

import { pascalCase } from "@stackra/support";

import { isMacroClass } from "#core/functions/is-macro-class.function";
import { macroHint } from "#core/functions/macro-hint.function";
import { checkAppendOnly } from "#core/functions/check-append-only.function";
import { emitMigrations } from "#core/functions/emit-migrations.function";
import { folderKey } from "#core/functions/folder-key.function";
import { isModuleFolder } from "#core/functions/is-module-folder.function";
import { emitBlueprintMacros } from "#core/functions/emit-blueprint-macros.function";
import { migrationId } from "#core/functions/migration-id.function";
import { moduleDependsOn } from "#core/functions/module-depends-on.function";
import { orderMigrations } from "#core/functions/order-migrations.function";
import type { GenError } from "#core/types/gen-error.type";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { MigrationUnit } from "#core/types/migration-unit.type";
import type { OwnMacro } from "#core/types/own-macro.type";
import { dependencyPath } from "#node/functions/dependency-path.function";
import { loadSourceModule } from "#node/functions/load-source-module.function";

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
}

/** The specifiers a migration may import: the frozen-snapshot rule of ADR 0159 (0305 note). */
const ALLOWED_IMPORTS: ReadonlySet<string> = new Set(["@stackra/database", "#stackra/migrations"]);

/** A macro class and the module that owns it. */
interface OwnedMacro {
  readonly macro: unknown;
  readonly owner: string;
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
  filesOf(join(root, "src/modules"), "")
    .filter((folder) => isModuleFolder(folder))
    .map((folder) => ({
      key: folderKey(folder),
      dir: join(root, "src/modules", folder),
    }));

/** The import specifiers of a source file: imports, re-exports and `import()`, type-only ones included. */
function importsOf(path: string): string[] {
  const ts = createRequire(import.meta.url)("typescript6") as {
    preProcessFile: (
      text: string,
      readImports: boolean,
      detectJavaScript: boolean,
    ) => { importedFiles: readonly { fileName: string }[] };
  };
  return ts
    .preProcessFile(readFileSync(path, "utf8"), true, true)
    .importedFiles.map((imported) => imported.fileName);
}

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
  const macroFiles: { readonly path: string; readonly owner: string }[] = [];
  const ownMacros: OwnMacro[] = [];
  // The modules each declared package's own `package.json` dependencies name, to order its migrations after theirs.
  const packageNeeds = new Map<string, string[]>();
  // Each package whose `./node` macros the compiler needs, with the folder it resolves from.
  const macroPackages: { readonly name: string; readonly base: string }[] = [];
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
    for (const name of filesOf(macros, ".macro.ts")) {
      macroFiles.push({ path: join(macros, name), owner: module.key });
      // A macro is `<name>.macro.ts` exporting `<Name>Macro` (ADR 0305).
      const stem = name.slice(0, -".macro.ts".length);
      ownMacros.push({
        name: `${pascalCase(stem)}Macro`,
        from: `#modules/${basename(module.dir)}/database/macros/${stem}.macro`,
      });
    }
  }
  // A package's own migrations, keyed as a host keys them (`@stackra/ai` is `ai`), for its migration check (STA-1689).
  if (ir.layout === "package") {
    const module = folderKey(ir.package.slice(ir.package.lastIndexOf("/") + 1));
    const dir = join(root, "src/node/database/migrations");
    for (const name of filesOf(dir, ".migration.ts")) {
      const id = migrationId(module, name);
      if (id !== undefined)
        found.push({
          id,
          module,
          owner: "member",
          path: join(dir, name),
          file: relative(root, join(dir, name)),
        });
    }
    // Its own macros through its built `./node` entry, as a host loads them: from source their extensionless
    // `#node/types/*` imports do not resolve (STA-1689).
    if (existsSync(join(root, "src/node/database/macros")))
      macroPackages.push({ name: ir.package, base: root });
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
    if (
      !macroPackages.some((known) => known.name === name) &&
      dependencyPath(root, name, "src/node/database/macros") !== undefined
    )
      macroPackages.push({ name, base: root });
    // A package's migrations use the macros of the packages it declares (ai's `t.belongsToTenant()` is tenancy's),
    // which the member may not declare itself: resolved from that package's folder (STA-1689).
    const json = dir === undefined ? undefined : dependencyPath(root, name, "package.json");
    if (json === undefined) continue;
    const base = dirname(realpathSync(json));
    const declared = JSON.parse(readFileSync(json, "utf8")) as {
      readonly dependencies?: Readonly<Record<string, string>>;
    };
    packageNeeds.set(
      module,
      Object.keys(declared.dependencies ?? {}).map((dependency) =>
        folderKey(dependency.slice(dependency.lastIndexOf("/") + 1)),
      ),
    );
    for (const dependency of Object.keys(declared.dependencies ?? {}))
      if (
        !macroPackages.some((known) => known.name === dependency) &&
        dependencyPath(base, dependency, "src/node/database/macros") !== undefined
      )
        macroPackages.push({ name: dependency, base });
  }
  const blueprint = ir.layout === "service" ? emitBlueprintMacros(ownMacros) : [];
  if (found.length === 0) return { files: blueprint, errors: [] };

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
  const owned: OwnedMacro[] = [];
  for (const { path, owner } of macroFiles) {
    try {
      for (const macro of Object.values(await load(path)).filter(isMacroClass))
        owned.push({ macro, owner });
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
  for (const { name, base } of macroPackages) {
    try {
      const resolve = createRequire(join(base, "package.json")).resolve;
      for (const macro of Object.values(await load(resolve(`${name}/node`))).filter(isMacroClass))
        owned.push({ macro, owner: folderKey(name.slice(name.lastIndexOf("/") + 1)) });
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

  // Each macro as a same-named subclass that records its owner when a migration calls it (the macro edge).
  const called = new Set<string>();
  const macros = owned.map(({ macro, owner }) => {
    const Base = macro as new () => { apply: (...args: never[]) => unknown };
    const Recording = class extends Base {
      override apply(...args: never[]): unknown {
        called.add(owner);
        return super.apply(...args);
      }
    };
    Object.defineProperty(Recording, "name", { value: (macro as { name: string }).name });
    return Recording;
  });
  const packageModules = new Set(found.filter((f) => f.owner === "package").map((f) => f.module));
  const units: MigrationUnit[] = [];
  for (const migration of found) {
    // A migration is a frozen snapshot: refused before it is loaded when it imports more than the two specifiers.
    const forbidden = importsOf(migration.path).filter(
      (specifier) => !ALLOWED_IMPORTS.has(specifier),
    );
    if (forbidden.length > 0) {
      for (const specifier of forbidden)
        errors.push(
          refusal(
            "migration_import_forbidden",
            migration.file,
            specifier,
            `${migration.file} imports ${specifier}; a migration imports only @stackra/database and #stackra/migrations`,
            "remove the import and write the table and column names as literals (ADR 0159: a migration is a frozen snapshot)",
          ),
        );
      continue;
    }
    let exported: Record<string, unknown>;
    try {
      // A package installed from the registry ships its migrations as source under node_modules, where Node refuses
      // to strip types; loadSourceModule strips them into .stackra/cache first.
      exported = await loadSourceModule(root, migration.path);
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
    called.clear();
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
        needs: [
          ...new Set([
            ...called,
            ...(migration.owner === "package"
              ? (packageNeeds.get(migration.module) ?? [])
              : [...packageModules, ...moduleDependsOn(ir, migration.module)]),
          ]),
        ].filter((need) => need !== migration.module),
        steps: compiled.steps,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(
        refusal(
          "migration_compile_failed",
          migration.file,
          migration.id,
          `${migration.id} does not compile: ${message}${macroHint(message, macros)}`,
          "fix the migration as the message says; an applied migration is frozen, so fix it in a new one",
        ),
      );
    }
  }
  errors.push(...checkAppendOnly(ir, units));
  if (errors.length > 0) return { files: [], errors };
  const { ordered, errors: orderErrors } = orderMigrations(units);
  return orderErrors.length > 0
    ? { files: [], errors: orderErrors }
    : { files: [...emitMigrations(ordered), ...blueprint], errors: [] };
}
