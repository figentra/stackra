/**
 * Stackra file contract:
 * Purpose: `migrationFiles(options)`, the files of `stackra new migration <name> --fields`: the module's next numbered
 *          migration, which adds the fields to an existing table as nullable columns (the expand step), and a unit test
 *          that runs it on PGlite and finds each new column.
 * Boundary: pure; returns text and writes nothing. A NOT NULL column, a drop or a rename is not scaffolded: it is the
 *           contract step after a backfill, written by hand (ADR 0159 as amended: expand and contract). The model's
 *           matching fields are added by the caller.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended: frozen snapshots, nullability and a comment per column, expand and
 *                     contract); ADR 0294 (the v3 shape); ADR 0266 (the memory driver); ADR 0022.
 */
import { pascalCase } from "@stackra/support";

import { contractHeader } from "#node/feature-scaffold/functions/contract-header.function";
import type { FeatureField } from "#node/feature-scaffold/types/feature-field.type";
import type { TemplateFile } from "#node/types/template-file.type";

/**
 * The files of a new alter migration.
 *
 * @param options - the module folder and schema, the kebab name, the migration number, the table and the fields.
 * @example
 * migrationFiles({ module: "orders", schema: "orders", name: "add-notes", number: "0002", table: "orders", fields })
 *   .map((file) => file.path);
 */
export function migrationFiles(options: {
  readonly module: string;
  readonly schema: string;
  readonly name: string;
  readonly number: string;
  readonly table: string;
  readonly fields: readonly FeatureField[];
}): readonly TemplateFile[] {
  const { module, schema, name, number, table, fields } = options;
  const stem = `${number}-${name}`;
  const className = `${pascalCase(name)}Migration`;
  const folder = `src/modules/${module}/database/migrations`;
  const columns = fields.map((field) => field.column);
  const listed =
    columns.length === 1
      ? `\`${columns[0]}\``
      : `${columns
          .slice(0, -1)
          .map((column) => `\`${column}\``)
          .join(", ")} and \`${columns.at(-1)}\``;
  const migration = [
    contractHeader({
      purpose: `the migration that adds ${listed} to \`${schema}.${table}\`, nullable, so rows written before it stay valid.`,
      boundary:
        "a frozen snapshot once applied: it imports only `@stackra/database` and every name is a literal. Making a column NOT NULL is a later contract migration, after a backfill. No `down()`: gen derives the dev inverse.",
      runtime: "node",
      contract: "ADR 0159 (as amended: expand and contract); ADR 0294 (the v3 shape).",
    }),
    `import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";`,
    "",
    `/** Adds ${listed} to ${table}. */`,
    `export class ${className} extends Migration {`,
    "  /** One nullable column per field. */",
    "  up(schema: SchemaBuilder): void {",
    `    schema.table(${JSON.stringify(table)}, (t: Blueprint) => {`,
    ...fields.map(
      (field) => `      ${field.blueprint}.nullable().comment(${JSON.stringify(field.doc)});`,
    ),
    "    });",
    "  }",
    "}",
    "",
  ].join("\n");
  const sql = `select column_name from information_schema.columns where table_schema = '${schema}' and table_name = '${table}' and column_name in (${columns.map((column) => `'${column}'`).join(", ")}) order by column_name`;
  const test = [
    contractHeader({
      purpose: `runs \`${stem}\` on PGlite: the memory driver applies the compiled migrations \`stackra gen\` writes into \`.stackra/migrations\`, and \`${schema}.${table}\` has ${listed}.`,
      boundary: "unit tier: PGlite runs in this process, no Docker.",
      runtime: "node (vitest)",
      contract: "ADR 0022 (test placement); ADR 0266 (memory first); ADR 0159.",
    }),
    `import { MemoryDatabaseDriver } from "@stackra/database/testing";`,
    `import { describe, expect, it } from "@stackra/testing";`,
    "",
    `describe(${JSON.stringify(`${stem} migration`)}, { timeout: 60_000 }, () => {`,
    `  it(${JSON.stringify(`adds ${columns.join(", ")} to ${table}`)}, async () => {`,
    "    const database = new MemoryDatabaseDriver();",
    "    // raw-sql: the test checks the migration's columns, which is DDL",
    "    const rows = await database",
    "      .em()",
    `      .execute<{ column_name: string }[]>(${JSON.stringify(sql)});`,
    `    expect(rows.map((row) => row.column_name)).toEqual(${JSON.stringify(columns.toSorted())});`,
    "    await database.close();",
    "  });",
    "});",
    "",
  ].join("\n");
  return [
    { path: `${folder}/${stem}.migration.ts`, content: migration },
    { path: `${folder}/__tests__/${stem}.migration.test.ts`, content: test },
  ];
}
