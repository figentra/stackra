/**
 * Stackra file contract:
 * Purpose: integration test of the release gate through the real runner on real Postgres: `migrate` in a forward-only
 *          environment refuses a contract step whose release it applies, leaves the version at that release, clean,
 *          refuses it again when the same release is retried and when a run names no release, and applies it under the
 *          next release (STA-1406).
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers; the compiled migrations are written as gen
 *           writes them into a temporary member folder, and `DATABASE_URL` points the runner at the container.
 * Runtime: node (vitest)
 * Governing contract: ADR 0159 (decision 3; the 2026-10-24 note: `stackra db migrate`); ADR 0022; ADR 0269.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import { Migration } from "#core/bases/migration.base";
import { compileMigration } from "#core/functions/compile-migration.function";
import type { Blueprint } from "#core/types/blueprint.type";
import type { SchemaBuilder } from "#core/types/schema-builder.type";
import { migrate } from "#node/functions/migrate.function";
import { usePostgres } from "#testing/use-postgres";

class CreateNotesMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.create("notes", (t: Blueprint) => {
      t.string("id", 33).notNull().comment("The note's id.");
      t.string("body").notNull().comment("The note's text.");
      t.string("legacy_ref").nullable().comment("A reference the release before stops reading.");
    });
  }
}

class StopReadingRefMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.table("notes", (t: Blueprint) => {
      t.string("source").nullable().comment("Where the note came from.");
    });
  }
}

class DropRefMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.table("notes", (t: Blueprint) => {
      t.dropColumn("legacy_ref", { after: "notes.0002_stop_reading_ref", type: "text" });
    });
  }
}

const postgres = usePostgres({ entities: [], migrations: [] });
const previous = { url: process.env["DATABASE_URL"], direct: process.env["DATABASE_DIRECT_URL"] };
const members: string[] = [];

beforeAll(() => {
  process.env["DATABASE_URL"] = postgres.url;
  delete process.env["DATABASE_DIRECT_URL"];
});
afterAll(() => {
  if (previous.url === undefined) delete process.env["DATABASE_URL"];
  else process.env["DATABASE_URL"] = previous.url;
  if (previous.direct !== undefined) process.env["DATABASE_DIRECT_URL"] = previous.direct;
  for (const root of members) rmSync(root, { recursive: true, force: true });
});

/** A member folder whose `.stackra/migrations` holds `units` as gen writes them, numbered from 1. */
function member(
  units: readonly (readonly [string, Parameters<typeof compileMigration>[0]])[],
): string {
  const root = mkdtempSync(join(tmpdir(), "stackra-gate-"));
  members.push(root);
  const folder = join(root, ".stackra", "migrations");
  mkdirSync(folder, { recursive: true });
  let sequence = 0;
  for (const [id, type] of units) {
    const { steps } = compileMigration(type, { schema: "notes", createsSchema: sequence === 0 });
    for (const [index, step] of steps.entries()) {
      sequence += 1;
      const name = `${String(sequence).padStart(4, "0")}_${id.replace(".", "_")}${steps.length > 1 ? `_${index + 1}` : ""}`;
      const header = step.transactional ? "" : "-- stackra:transactional=false\n";
      writeFileSync(
        join(folder, `${name}.up.sql`),
        header + step.sql.map((statement) => `${statement};\n`).join(""),
      );
    }
  }
  return root;
}

const ALL = [
  ["notes.0001_create_notes", CreateNotesMigration],
  ["notes.0002_stop_reading_ref", StopReadingRefMigration],
  ["notes.0003_drop_ref", DropRefMigration],
] as const;

describe("migrate and the release gate", () => {
  it("refuses a contract step under the release that applied the step it waits for, retried or not, and applies it under the next", async () => {
    const environment = "production";
    expect(await migrate({ cwd: member(ALL.slice(0, 1)), environment, release: "v1" })).toEqual({
      applied: ["0001_notes_0001_create_notes"],
    });
    const next = member(ALL);
    const refused =
      /0003_notes_0003_drop_ref failed: .*notes\.notes drop column legacy_ref is a contract step after notes\.0002_stop_reading_ref, which release v2 applies/;
    await expect(migrate({ cwd: next, environment, release: "v2" })).rejects.toThrow(refused);
    const { database } = postgres;
    const read = (sql: string) => database.transaction(() => database.em().execute(sql));
    expect(await read("select version, dirty from schema_migrations")).toEqual([
      { version: "2", dirty: false },
    ]);
    expect(
      await read("select version, release_id from schema_migrations_history order by version"),
    ).toEqual([
      { version: "1", release_id: "v1" },
      { version: "2", release_id: "v2" },
    ]);
    // the same deploy retried (a CI retry, a re-run pipeline): release v1's code may still be serving
    await expect(migrate({ cwd: next, environment, release: "v2" })).rejects.toThrow(refused);
    // a run that names no release cannot be told from v2
    await expect(migrate({ cwd: next, environment })).rejects.toThrow(/this run names no release/);
    expect(await read("select version, dirty from schema_migrations")).toEqual([
      { version: "2", dirty: false },
    ]);
    expect(await migrate({ cwd: next, environment, release: "v3" })).toEqual({
      applied: ["0003_notes_0003_drop_ref"],
    });
    const columns = await database.transaction(() =>
      database
        .em()
        .execute(
          "select column_name from information_schema.columns where table_schema = 'notes' and table_name = 'notes' order by ordinal_position",
        ),
    );
    expect(columns).toEqual([
      { column_name: "id" },
      { column_name: "body" },
      { column_name: "source" },
    ]);
  });
});
