/**
 * Stackra file contract:
 * Purpose: `connectGuideDatabase`, the test harness of the task guides' examples: it compiles each guide module's
 *          migrations with `compileMigration` (as gen does), writes them as gen's `.stackra/migrations` files under a
 *          temporary member root, proves them with `checkMigrations` (apply, revert, apply again on PGlite) and connects
 *          a `MemoryDatabaseDriver` that starts from them, so the examples run on real Postgres SQL without Docker.
 * Boundary: test support only, under `scripts/guides`; it stands in for what `stackra gen` and the generated test
 *           setup do in an app (writing the migration files), never for the examples themselves. The working
 *           directory is pointed at the temporary root only while the driver opens PGlite, then put back.
 * Runtime: node (vitest)
 * Governing contract: ADR 0159 (compiled migrations, the `N_name.up.sql` layout); ADR 0266 (memory first); ADR 0269
 *                     (testing helpers); STA-2843 (tested task guides).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { compileMigration } from "@stackra/database";
import type { MigrationClass } from "@stackra/database";
import { checkMigrations, MemoryDatabaseDriver } from "@stackra/database/testing";

import type { GuideDatabase } from "./guide-database";
import type { GuideModule } from "./guide-module";

/** `CreateProjectsMigration` as gen names its file stem: `create_projects`. */
function stemOf(migration: MigrationClass): string {
  return migration.name
    .replace(/Migration$/, "")
    .replaceAll(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();
}

/**
 * Compiles, checks and connects the migrations of `modules`.
 *
 * @throws Error naming the file when a migration does not apply, revert or apply again.
 * @example
 * const { database, close } = await connectGuideDatabase([
 *   { schema: "projects", migrations: [CreateProjectsMigration] },
 * ]);
 */
export async function connectGuideDatabase(
  modules: readonly GuideModule[],
): Promise<GuideDatabase> {
  const root = mkdtempSync(join(tmpdir(), "stackra-guide-"));
  const folder = join(root, ".stackra", "migrations");
  mkdirSync(folder, { recursive: true });
  const sql: Record<string, string> = {};
  let sequence = 0;
  for (const module of modules) {
    for (const [index, migration] of module.migrations.entries()) {
      const { steps } = compileMigration(migration, {
        schema: module.schema,
        createsSchema: index === 0,
        macros: module.macros ?? [],
      });
      const unit = `${module.schema}_${String(index + 1).padStart(4, "0")}_${stemOf(migration)}`;
      for (const [part, step] of steps.entries()) {
        sequence += 1;
        const name = `${String(sequence).padStart(4, "0")}_${unit}${steps.length > 1 ? `_${part + 1}` : ""}`;
        const header = step.transactional ? "" : "-- stackra:transactional=false\n";
        const up = header + step.sql.map((statement) => `${statement};\n`).join("");
        sql[name] = up;
        writeFileSync(join(folder, `${name}.up.sql`), up);
        if (step.inverse !== false)
          writeFileSync(
            join(folder, `${name}.down.sql`),
            header + step.inverse.map((statement) => `${statement};\n`).join(""),
          );
      }
    }
  }
  await checkMigrations(folder);
  // The memory driver reads `.stackra/migrations` under the working directory when it opens PGlite (first query).
  const cwd = process.cwd.bind(process);
  process.cwd = () => root;
  const database = new MemoryDatabaseDriver();
  try {
    // raw-sql: the first statement opens PGlite while the working directory points at the compiled migrations
    await database.em().execute("select 1");
  } finally {
    process.cwd = cwd;
  }
  return {
    database,
    sql,
    async close() {
      await database.close();
      rmSync(root, { recursive: true, force: true });
    },
  };
}
