/**
 * Stackra file contract:
 * Purpose: integration tests of `PostgresDatabaseDriver` on real Postgres through `usePostgres` and a compiled
 *          migration: a `CrudService` writes in a transaction and reads back, `insert` surfaces a `UniqueViolation`
 *          and leaves the caller's transaction usable, `table` pages, `withScope` sets `app.scope_id`, `app.scope_path`
 *          and `app.scope_paths`, and the compiled ancestor policy on `scope_path` shows a session only the rows at or
 *          below its granted paths (an unprivileged role sees nothing of another scope's rows, and nothing without a
 *          scope), served from the GiST index.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers; the container's superuser writes the rows and
 *           an unprivileged role reads them, because a superuser bypasses row-level security.
 * Runtime: node (vitest)
 * Governing contract: ADR 0239; ADR 0327 (decisions 3, 5 and 9); `.agents/rules/tenancy.md` (isolation test);
 *                     ADR 0159; ADR 0182; ADR 0269.
 */
import { EntitySchema } from "@mikro-orm/core";
import { SortDirection } from "@stackra/contracts";
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { HasPublicId, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { UniqueViolation } from "#core/index";
import { CrudService } from "#core/bases/crud-service.base";
import { Migration } from "#core/bases/migration.base";
import { Extension } from "#core/enums/extension.enum";
import { compileMigration } from "#core/functions/compile-migration.function";
import { registerModelPartners } from "#core/functions/register-model-partners.function";
import type { Blueprint } from "#core/types/blueprint.type";
import type { SchemaBuilder } from "#core/types/schema-builder.type";
import { usePostgres } from "#testing/use-postgres.fixture";

const acme: ScopeRef = { id: "scp_01ja0000000000000000000001", path: "platform.acme" };
const shop: ScopeRef = { id: "scp_01ja0000000000000000000002", path: "platform.acme.shop_eu" };
const globex: ScopeRef = { id: "scp_01ja0000000000000000000003", path: "platform.globex" };

class Note extends Model.with(HasPublicId("note")) {
  scopeId!: string;

  scopePath!: string;

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
    scopeId: { type: "string", fieldName: "scope_id", columnType: "varchar(33)" },
    scopePath: { type: "string", fieldName: "scope_path", columnType: "ltree" },
    body: { type: "text" },
  },
});

class CreateNotesMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.createExtension(Extension.Ltree);
    schema.create("notes", (t: Blueprint) => {
      t.hasPublicId("note");
      t.scopeId().notNull().comment("The scope node the note belongs to.");
      t.scopePath().notNull().comment("The node's path, denormalised.");
      t.string("body").notNull().comment("The note's text.");
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
    schema.sql("create role notes_reader nologin", { inverse: "drop role notes_reader" });
    schema.sql("grant usage on schema notes to notes_reader", { inverse: false });
    schema.sql("grant select on notes.notes to notes_reader", { inverse: false });
  }
}

const postgres = usePostgres({
  entities: [NoteSchema],
  migrations: [compileMigration(CreateNotesMigration, { schema: "notes", createsSchema: true })],
});

/** Runs `sql` as the unprivileged role inside `scopes`, with the settings `withScope` wrote. */
function readAs(
  scopes: ScopeRef | readonly ScopeRef[],
  sql: string,
  before: readonly string[] = [],
) {
  const { database } = postgres;
  return database.withScope(scopes, async () => {
    const em = database.em();
    const [settings] = await em.execute(
      "select current_setting('app.scope_id', true) as id, current_setting('app.scope_path', true) as path, current_setting('app.scope_paths', true) as paths",
    );
    for (const statement of before) await em.execute(statement);
    await em.execute("set local role notes_reader");
    return { settings, rows: await em.execute(sql) };
  });
}

/** The settings and the note bodies the unprivileged role sees inside `scopes`. */
async function bodiesIn(scopes: ScopeRef | readonly ScopeRef[]) {
  const { settings, rows } = await readAs(scopes, "select body from notes.notes order by body");
  return { settings, bodies: rows.map((row) => row.body) };
}

/** A note row of `scope`. */
function noteOf(id: PublicId<"note">, scope: ScopeRef, body: string) {
  return { id, scopeId: scope.id, scopePath: scope.path, body };
}

describe("PostgresDatabaseDriver", () => {
  it("writes in a transaction, reads back and pages", async () => {
    const notes = new NoteService();
    await postgres.database.transaction(async () => {
      notes.create(noteOf("note_01ja0000000000000000000001", acme, "a"));
      notes.create(noteOf("note_01ja0000000000000000000002", shop, "b"));
      notes.create(noteOf("note_01ja0000000000000000000003", globex, "c"));
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
        notes.insert(noteOf("note_01ja0000000000000000000001", acme, "x")),
      ).rejects.toBeInstanceOf(UniqueViolation);
      expect(await notes.count({ scopeId: acme.id })).toBe(1);
    });
  });

  it("sets the scope settings and shows each scope only the rows at or below its paths", async () => {
    expect(await bodiesIn(acme)).toEqual({
      settings: { id: acme.id, path: acme.path, paths: acme.path },
      bodies: ["a", "b"],
    });
    expect(await bodiesIn(shop)).toEqual({
      settings: { id: shop.id, path: shop.path, paths: shop.path },
      bodies: ["b"],
    });
    expect(await bodiesIn([shop, globex])).toEqual({
      settings: { id: "", path: "", paths: `${shop.path}|${globex.path}` },
      bodies: ["b", "c"],
    });
    expect((await bodiesIn([])).bodies).toEqual([]);
    const { database } = postgres;
    expect(
      await database.transaction(async () => {
        const em = database.em();
        await em.execute("set local role notes_reader");
        return em.execute("select body from notes.notes");
      }),
    ).toEqual([]);
  });

  it("serves the ancestor policy from the GiST index", async () => {
    const { rows } = await readAs([shop, globex], "explain select body from notes.notes", [
      "set local enable_seqscan = off",
    ]);
    expect(rows.map((row) => String(row["QUERY PLAN"])).join("\n")).toContain(
      "idx_notes_scope_path",
    );
  });
});
