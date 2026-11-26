/**
 * Stackra file contract:
 * Purpose: integration tests of a setting default (`defaultSetting`) on a real Postgres: added to a table that has
 *          rows, the column leaves them null; an insert that names no value stores the transaction's setting, and one
 *          with the setting unset or `''` stores null.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers.
 * Runtime: node (vitest)
 * Governing contract: ADR 0347 (decision 1); ADR 0159 (as amended: expand and contract); ADR 0182.
 */
import { describe, expect, it } from "@stackra/testing";

import { Migration } from "#core/bases/migration.base";
import { compileMigration } from "#core/functions/compile-migration.function";
import type { Blueprint } from "#core/types/blueprint.type";
import type { SchemaBuilder } from "#core/types/schema-builder.type";
import { usePostgres } from "#testing/use-postgres";

const ACME = "scp_01jab3k4m5n6p7q8r9s0t1v2w3";

class CreateNotesMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.create("notes", (t: Blueprint) => {
      t.string("body").notNull().comment("The note's text.");
    });
  }
}

class AddWorkspaceMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.table("notes", (t: Blueprint) => {
      t.link("workspace_id")
        .nullable()
        .defaultSetting("app.workspace_id")
        .comment("The workspace.");
    });
  }
}

const postgres = usePostgres({
  migrations: [
    compileMigration(CreateNotesMigration, { schema: "notes", createsSchema: true }),
    {
      after: [],
      steps: [
        { transactional: true, inverse: false, sql: ["insert into notes.notes values ('before')"] },
      ],
    },
    compileMigration(AddWorkspaceMigration, { schema: "notes" }),
  ],
});

/** Inserts `body` in a transaction whose `app.workspace_id` is `setting`, or left unset. */
function insertAs(setting: string | undefined, body: string): Promise<void> {
  const { database } = postgres;
  return database.transaction(async () => {
    const em = database.em();
    if (setting !== undefined)
      await em.execute("select set_config('app.workspace_id', ?, true)", [setting]);
    await em.execute("insert into notes.notes (body) values (?)", [body]);
  });
}

describe("ColumnRecord setting default", () => {
  it("leaves older rows null, stores the setting, and null while it is unset or empty", async () => {
    await insertAs(ACME, "set");
    await insertAs("", "empty");
    await insertAs(undefined, "unset");
    const { database } = postgres;
    const rows = await database.transaction(() =>
      database.em().execute("select body, workspace_id from notes.notes order by body"),
    );
    expect(rows).toEqual([
      { body: "before", workspace_id: null },
      { body: "empty", workspace_id: null },
      { body: "set", workspace_id: ACME },
      { body: "unset", workspace_id: null },
    ]);
  });
});
