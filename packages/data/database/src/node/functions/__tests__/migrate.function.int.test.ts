/**
 * Stackra file contract:
 * Purpose: integration test of the release gate through the real runner on real Postgres: `migrate` in a forward-only
 *          environment refuses a run that names no release on a database with applied files before any change while a
 *          pending file holds a contract step (naming `--release` and `STACKRA_RELEASE`), applies plain additive files
 *          naming none and holds a later contract step until a named run holding them finishes, refuses before any
 *          change a contract step
 *          shipped with the migration it waits for, refuses a contract step whose release applied that migration,
 *          retried or not, and applies it under the next release; it holds the step under every later release while
 *          the run that applied the migration never finished, until a release holding it finishes its run; on a fresh
 *          database a run naming no release applies every file and records no finished release (STA-1406).
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers; the compiled migrations are written as gen
 *           writes them into a temporary member folder, and `DATABASE_URL` points the runner at the container.
 * Runtime: node (vitest)
 * Governing contract: ADR 0159 (decision 3; the 2026-10-24 note: `stackra db migrate`); ADR 0022; ADR 0269.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@stackra/testing";

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

/**
 * A member folder whose `.stackra/migrations` holds `units` as gen writes them, numbered from 1; a unit given as SQL
 * text is written as one transactional step.
 */
function member(
  units: readonly (readonly [string, Parameters<typeof compileMigration>[0] | string])[],
): string {
  const root = mkdtempSync(join(tmpdir(), "stackra-gate-"));
  members.push(root);
  const folder = join(root, ".stackra", "migrations");
  mkdirSync(folder, { recursive: true });
  let sequence = 0;
  for (const [id, type] of units) {
    const steps =
      typeof type === "string"
        ? [{ sql: [type], transactional: true }]
        : compileMigration(type, { schema: "notes", createsSchema: sequence === 0 }).steps;
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

/** The rows of `sql` on the container. */
const read = (sql: string) =>
  postgres.database.transaction(() => postgres.database.em().execute(sql));

/** The columns of `notes.notes`, in order. */
const columns = () =>
  read(
    "select column_name from information_schema.columns where table_schema = 'notes' and table_name = 'notes' order by ordinal_position",
  );

describe("migrate and the release gate", () => {
  beforeEach(async () => {
    await read(
      "drop schema if exists notes cascade; drop table if exists schema_migrations, schema_migrations_history, schema_migrations_releases",
    );
  });

  it("refuses a contract step shipped with the migration it waits for before any change, holds it under the release that applied that migration, retried or not, and applies it under the next", async () => {
    const environment = "production";
    const env = {};
    expect(
      await migrate({ cwd: member(ALL.slice(0, 1)), environment, release: "v1" }, env),
    ).toEqual({ applied: ["0001_notes_0001_create_notes"] });
    const next = member(ALL);
    // the deploy of v2 forgot STACKRA_RELEASE while it holds a contract step: refused before 0002 applies, naming both
    // ways to set the release
    const unnamed = migrate({ cwd: next, environment }, env);
    await expect(unnamed).rejects.toThrow(
      /refused before any change: this production run names no release, and the database already has applied migrations \(version 1\) while 0003_notes_0003_drop_ref holds a contract step/,
    );
    await expect(unnamed).rejects.toThrow(
      /pass --release <version or commit> to stackra db migrate, or set STACKRA_RELEASE=<version or commit>/,
    );
    // v2 ships the drop with the migration it waits for: refused before 0002 applies, since v1 still reads legacy_ref
    // and a failed v2 would leave it serving
    await expect(migrate({ cwd: next, environment, release: "v2" }, env)).rejects.toThrow(
      "refused before any change: 0003_notes_0003_drop_ref holds a contract step after notes.0002_stop_reading_ref, which this same run applies (0002_notes_0002_stop_reading_ref)",
    );
    expect(await read("select version, dirty from schema_migrations")).toEqual([
      { version: "1", dirty: false },
    ]);
    expect(
      await read("select version, release_id from schema_migrations_history order by version"),
    ).toEqual([{ version: "1", release_id: "v1" }]);
    expect(await columns()).toContainEqual({ column_name: "legacy_ref" });
    // v2 without the drop applies, and its run finishes
    expect(
      await migrate({ cwd: member(ALL.slice(0, 2)), environment, release: "v2" }, env),
    ).toEqual({ applied: ["0002_notes_0002_stop_reading_ref"] });
    expect(
      await read(
        "select release_id, through_version from schema_migrations_releases order by release_id",
      ),
    ).toEqual([
      { release_id: "v1", through_version: "1" },
      { release_id: "v2", through_version: "2" },
    ]);
    // the drop under v2 again (a release id reused across deploys): 0002 is recorded under v2, so it waits
    await expect(migrate({ cwd: next, environment, release: "v2" }, env)).rejects.toThrow(
      /0003_notes_0003_drop_ref failed: .*notes\.notes drop column legacy_ref is a contract step after notes\.0002_stop_reading_ref, which release v2 applies/,
    );
    // a run that names no release cannot be told from v2
    await expect(migrate({ cwd: next, environment }, env)).rejects.toThrow(
      /refused before any change: this production run names no release/,
    );
    expect(await read("select version, dirty from schema_migrations")).toEqual([
      { version: "2", dirty: false },
    ]);
    expect(await migrate({ cwd: next, environment, release: "v3" }, env)).toEqual({
      applied: ["0003_notes_0003_drop_ref"],
    });
    expect(await columns()).toEqual([
      { column_name: "id" },
      { column_name: "body" },
      { column_name: "source" },
    ]);
  });

  it("holds a contract step while the run that applied the migration it waits for never finished, under any later release", async () => {
    const environment = "production";
    const env = {};
    await migrate({ cwd: member(ALL.slice(0, 1)), environment, release: "v1" }, env);
    // v2 applies 0002, then a later file fails: v2's deploy fails and v1 keeps serving, reading legacy_ref
    const failing = member([...ALL.slice(0, 2), ["notes.0003_broken", "select 1 / 0"]]);
    await expect(migrate({ cwd: failing, environment, release: "v2" }, env)).rejects.toThrow(
      /0003_notes_0003_broken failed/,
    );
    expect(
      await read("select version, release_id from schema_migrations_history order by version"),
    ).toEqual([
      { version: "1", release_id: "v1" },
      { version: "2", release_id: "v2" },
    ]);
    // v3 (a new commit) fixes the file and ships the drop: v2 never finished, so the drop is refused, and so it is
    // under every other id until a release holding 0002 finishes its run
    const fixed = [...ALL.slice(0, 2), ["notes.0003_broken", "select 1"]] as const;
    const withDrop = member([...fixed, ["notes.0004_drop_ref", DropRefMigration]]);
    const unfinished =
      /0004_notes_0004_drop_ref failed: .*notes\.notes drop column legacy_ref is a contract step after notes\.0002_stop_reading_ref, which release v2 applied, and the last migrate run of another release to finish \(v1\) does not hold it/;
    await expect(migrate({ cwd: withDrop, environment, release: "v3" }, env)).rejects.toThrow(
      unfinished,
    );
    await expect(migrate({ cwd: withDrop, environment, release: "v4" }, env)).rejects.toThrow(
      unfinished,
    );
    expect(await read("select version, dirty from schema_migrations")).toEqual([
      { version: "3", dirty: false },
    ]);
    expect(await columns()).toContainEqual({ column_name: "legacy_ref" });
    // a release of v1's files finishing again does not count: it never held 0002
    await migrate({ cwd: member(ALL.slice(0, 1)), environment, release: "v1" }, env);
    await expect(migrate({ cwd: withDrop, environment, release: "v5" }, env)).rejects.toThrow(
      unfinished,
    );
    // v5 ships without the drop and its run finishes; the drop applies in the release after it
    expect(await migrate({ cwd: member(fixed), environment, release: "v5" }, env)).toEqual({
      applied: [],
    });
    expect(await migrate({ cwd: withDrop, environment, release: "v6" }, env)).toEqual({
      applied: ["0004_notes_0004_drop_ref"],
    });
    expect(await columns()).not.toContainEqual({ column_name: "legacy_ref" });
  });

  it("applies plain additive files with no release named, and holds a later contract step until a named run holding them finishes", async () => {
    const environment = "production";
    const env = {};
    await migrate({ cwd: member(ALL.slice(0, 1)), environment, release: "v1" }, env);
    // a release step that names no release and ships only additive files applies them as before
    const additive = member(ALL.slice(0, 2));
    expect(await migrate({ cwd: additive, environment }, env)).toEqual({
      applied: ["0002_notes_0002_stop_reading_ref"],
    });
    expect(
      await read("select version, release_id from schema_migrations_history order by version"),
    ).toEqual([
      { version: "1", release_id: "v1" },
      { version: "2", release_id: null },
    ]);
    // no named run holding 0002 has finished, so the drop waits whatever release it ships under
    await expect(migrate({ cwd: member(ALL), environment, release: "v3" }, env)).rejects.toThrow(
      /which release \(none named\) applied, and the last migrate run of another release to finish \(v1\) does not hold it/,
    );
    expect(await columns()).toContainEqual({ column_name: "legacy_ref" });
    // the same files deployed under a named release finish its run; the drop applies in the release after it
    expect(await migrate({ cwd: additive, environment, release: "v2" }, env)).toEqual({
      applied: [],
    });
    expect(await migrate({ cwd: member(ALL), environment, release: "v3" }, env)).toEqual({
      applied: ["0003_notes_0003_drop_ref"],
    });
    expect(await columns()).not.toContainEqual({ column_name: "legacy_ref" });
  });

  it("applies every file on a fresh database when the run names no release, where no older release serves", async () => {
    expect(await migrate({ cwd: member(ALL), environment: "production" }, {})).toEqual({
      applied: [
        "0001_notes_0001_create_notes",
        "0002_notes_0002_stop_reading_ref",
        "0003_notes_0003_drop_ref",
      ],
    });
    expect(
      await read("select version, release_id from schema_migrations_history order by version"),
    ).toEqual([
      { version: "1", release_id: null },
      { version: "2", release_id: null },
      { version: "3", release_id: null },
    ]);
    expect(await read("select release_id from schema_migrations_releases")).toEqual([]);
  });
});
