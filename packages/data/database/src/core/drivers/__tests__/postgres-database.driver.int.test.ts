/**
 * Stackra file contract:
 * Purpose: integration tests of `PostgresDatabaseDriver` on real Postgres through `usePostgres` and a compiled
 *          migration: a `CrudService` writes in a transaction and reads back, `insert` surfaces a `UniqueViolation`
 *          and leaves the caller's transaction usable, `table` pages, `withScope` sets `app.<level>_id`, and the
 *          compiled row-level-security policy shows one scope's rows only to that scope (an unprivileged role sees
 *          nothing of another scope's rows).
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers; the container's superuser writes the rows and
 *           an unprivileged role reads them, because a superuser bypasses row-level security.
 * Runtime: node (vitest)
 * Governing contract: ADR 0239; `.agents/rules/tenancy.md` (isolation test); ADR 0159; ADR 0182; ADR 0269.
 */
import { EntitySchema } from "@mikro-orm/core";
import { SortDirection } from "@stackra/contracts";
import { HasPublicId, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { UniqueViolation } from "#core/index";
import { CrudService } from "#core/bases/crud-service.base";
import { Macro } from "#core/bases/macro.base";
import { Migration } from "#core/bases/migration.base";
import { compileMigration } from "#core/functions/compile-migration.function";
import { registerModelPartners } from "#core/functions/register-model-partners.function";
import type { Blueprint } from "#core/types/blueprint.type";
import type { ColumnGroup } from "#core/types/column-group.type";
import type { SchemaBuilder } from "#core/types/schema-builder.type";
import { usePostgres } from "#testing/use-postgres.fixture";

const workspaceA = "0192f5c3-7c1e-7a40-9d5b-2f8c1e0a9b11";
const workspaceB = "0192f5c3-7c1e-7a40-9d5b-2f8c1e0a9b22";

class Note extends Model.with(HasPublicId("note")) {
  workspaceId!: string;

  body!: string;
}

class NoteService extends CrudService<Note> {}

registerModelPartners([[NoteService, Note]]);

const NoteSchema = new EntitySchema<Note>({
  class: Note,
  schema: "notes",
  tableName: "notes",
  properties: {
    id: { type: "string", primary: true, columnType: "varchar(33)" },
    workspaceId: { type: "uuid", fieldName: "workspace_id" },
    body: { type: "text" },
  },
});

class BelongsToWorkspaceMacro extends Macro {
  apply(t: Blueprint): ColumnGroup {
    const group = t.group(t.uuid("workspace_id").notNull().comment("The owning workspace."));
    t.rowLevelSecurity("workspace");
    return group;
  }
}

class CreateNotesMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.create("notes", (blueprint: Blueprint) => {
      const t = blueprint as Blueprint & { belongsToWorkspace(): ColumnGroup };
      t.hasPublicId("note");
      t.belongsToWorkspace();
      t.string("body").notNull().comment("The note's text.");
    });
    schema.sql("create role notes_reader nologin", { inverse: "drop role notes_reader" });
    schema.sql("grant usage on schema notes to notes_reader", { inverse: false });
    schema.sql("grant select on notes.notes to notes_reader", { inverse: false });
  }
}

const postgres = usePostgres({
  entities: [NoteSchema],
  migrations: [
    compileMigration(CreateNotesMigration, {
      schema: "notes",
      createsSchema: true,
      macros: [BelongsToWorkspaceMacro],
    }),
  ],
});

describe("PostgresDatabaseDriver", () => {
  it("writes in a transaction, reads back and pages", async () => {
    const notes = new NoteService();
    await postgres.database.transaction(async () => {
      notes.create({ id: "note_01ja0000000000000000000001", workspaceId: workspaceA, body: "a" });
      notes.create({ id: "note_01ja0000000000000000000002", workspaceId: workspaceB, body: "b" });
    });
    expect((await notes.findOneOrFail({ id: "note_01ja0000000000000000000001" })).body).toBe("a");
    const page = await notes.table({
      limit: 1,
      sort: { key: "body", direction: SortDirection.Asc },
    });
    expect(page.items.map((note) => note.body)).toEqual(["a"]);
    expect(page.hasMore).toBe(true);
  });

  it("surfaces a unique violation and keeps the caller's transaction usable", async () => {
    const notes = new NoteService();
    await postgres.database.transaction(async () => {
      await expect(
        notes.insert({ id: "note_01ja0000000000000000000001", workspaceId: workspaceA, body: "x" }),
      ).rejects.toBeInstanceOf(UniqueViolation);
      expect(await notes.count({ workspaceId: workspaceA })).toBe(1);
    });
  });

  it("sets the scope setting and isolates rows by the compiled policy", async () => {
    const { database } = postgres;
    const read = (workspace: string) =>
      database.withScope({ level: "workspace", id: workspace }, async () => {
        const em = database.em();
        const [setting] = await em.execute("select current_setting('app.workspace_id', true) as v");
        await em.execute("set local role notes_reader");
        const rows = await em.execute("select body from notes.notes order by body");
        return { setting: (setting as { v: string }).v, bodies: rows.map((row) => row.body) };
      });
    expect(await read(workspaceA)).toEqual({ setting: workspaceA, bodies: ["a"] });
    expect(await read(workspaceB)).toEqual({ setting: workspaceB, bodies: ["b"] });
    expect(
      await database.transaction(async () => {
        const em = database.em();
        await em.execute("set local role notes_reader");
        return em.execute("select body from notes.notes");
      }),
    ).toEqual([]);
  });
});
