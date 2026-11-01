/**
 * Stackra file contract:
 * Purpose: `serviceExampleModule(options)`, the files of the example module `stackra new service --data` writes:
 *          `src/modules/notes/` with one model (`Note`), its migration, a unit test that runs the migration on PGlite
 *          and one integration test that runs it on Testcontainers Postgres. The model, migration and their shape are
 *          the consumer gate's fixture (STA-1813): a plain non-tenant model with a public id and timestamps.
 * Boundary: pure; returns text and writes nothing. The model is not tenant-owned; the tenancy rule applies to the
 *           first tenant-owned table. The tests read the table through raw SQL, since they check the migration.
 * Runtime: node
 * Governing contract: ADR 0294 (the v3 shape); ADR 0159 (migrations); ADR 0182 (test tiers); ADR 0266 and 0269 (the
 *                     memory driver and `usePostgres`); STA-1819.
 */
import type { TemplateFile } from "#node/types/template-file.type";
import type { TemplateOptions } from "#node/types/template-options.type";

/** The header of one example file. */
function header(purpose: string, boundary: string, runtime: string, contract: string): string {
  return [
    "/**",
    " * Stackra file contract:",
    ` * Purpose: ${purpose}`,
    ` * Boundary: ${boundary}`,
    ` * Runtime: ${runtime}`,
    ` * Governing contract: ${contract}`,
    " */",
  ].join("\n");
}

/**
 * The files of the example module of a `--data` service.
 *
 * @param options - the checked service options (the package name goes into the headers).
 * @example
 * serviceExampleModule(options).map((file) => file.path); // ["src/modules/notes/models/note.model.ts", ...]
 */
export function serviceExampleModule({ packageName }: TemplateOptions): readonly TemplateFile[] {
  const folder = "src/modules/notes";
  const migrations = `${folder}/database/migrations`;
  return [
    {
      path: `${folder}/models/note.model.ts`,
      content: [
        header(
          `\`Note\`, the one model of the example module of ${packageName}: a note with a text.`,
          "data only; a plain non-tenant model, replace it with your own.",
          "node",
          "ADR 0294 (the v3 shape); ADR 0305 (one declaration per file).",
        ),
        'import { HasPublicId, Model, Timestamps } from "@stackra/model";',
        'import { Str } from "@stackra/validation";',
        "",
        "/** A note. */",
        'export class Note extends Model.with(HasPublicId("not"), Timestamps) {',
        "  /** The note's text. */",
        "  @Str({ max: 500 })",
        "  text!: string;",
        "}",
        "",
      ].join("\n"),
    },
    {
      path: `${migrations}/0001-create-notes.migration.ts`,
      content: [
        header(
          "the first migration of the example module: the `notes` table of `Note`.",
          "a frozen snapshot that uses only `@stackra/database`; every name is a literal.",
          "node",
          "ADR 0159 (as amended); ADR 0294 (the v3 shape).",
        ),
        'import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";',
        "",
        "/** Creates the notes table. */",
        "export class CreateNotesMigration extends Migration {",
        "  /** The table. */",
        "  up(schema: SchemaBuilder): void {",
        '    schema.create("notes", (t: Blueprint) => {',
        '      t.hasPublicId("not");',
        "      t.timestamps();",
        '      t.string("text", 500).notNull().comment("The note\'s text.");',
        "    });",
        "  }",
        "}",
        "",
      ].join("\n"),
    },
    {
      path: `${migrations}/__tests__/0001-create-notes.migration.test.ts`,
      content: [
        header(
          "runs the notes migration on PGlite: the memory driver applies the compiled migrations `stackra gen` writes into `.stackra/migrations`, and the table starts empty.",
          "unit tier: PGlite runs in this process, no Docker.",
          "node (vitest)",
          "ADR 0022 (test placement); ADR 0266 (memory first); ADR 0159.",
        ),
        'import { MemoryDatabaseDriver } from "@stackra/database/testing";',
        'import { describe, expect, it } from "@stackra/testing";',
        "",
        'describe("0001-create-notes migration", { timeout: 60_000 }, () => {',
        '  it("creates an empty notes table", async () => {',
        "    const database = new MemoryDatabaseDriver();",
        "    // raw-sql: the test checks the migration's table, which is DDL",
        "    const rows = await database",
        "      .em()",
        '      .execute<{ count: number }[]>("select count(*)::int as count from notes.notes");',
        "    expect(rows).toEqual([{ count: 0 }]);",
        "    await database.close();",
        "  });",
        "});",
        "",
      ].join("\n"),
    },
    {
      path: `${migrations}/__tests__/0001-create-notes.migration.int.test.ts`,
      content: [
        header(
          "runs the notes migration on Postgres in a Testcontainers container, the production engine with its extensions.",
          "integration tier (`.int`): needs Docker; run it with `pnpm test:int`.",
          "node (vitest)",
          "ADR 0182 (test tiers); ADR 0022; ADR 0269 (decision 3: `usePostgres`).",
        ),
        'import { usePostgres } from "@stackra/database/testing";',
        'import { describe, expect, it } from "@stackra/testing";',
        "",
        'const postgres = usePostgres({ migrationsDirectory: ".stackra/migrations" });',
        "",
        'describe("0001-create-notes migration on Postgres", () => {',
        '  it("creates an empty notes table", async () => {',
        "    // raw-sql: the test checks the migration's table, which is DDL",
        "    const rows = await postgres.database",
        "      .em()",
        '      .execute<{ count: number }[]>("select count(*)::int as count from notes.notes");',
        "    expect(rows).toEqual([{ count: 0 }]);",
        "  });",
        "});",
        "",
      ].join("\n"),
    },
  ];
}
