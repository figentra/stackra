/**
 * Stackra file contract:
 * Purpose: unit tests of `readMigratedSchema` on PGlite: a replayed table comes back with its columns, types and
 *          nullability, its unique partial index with columns in order, its foreign key; the primary key is not an
 *          index; a failing step names its file; a schema outside the list is not read.
 * Boundary: unit tier: PGlite runs in this process, no Docker; it needs the optional peer `@electric-sql/pglite`
 *           (a devDependency of this package), so it runs wherever the repository's PGlite tests run.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159; ADR 0160; STA-1808.
 */
import { describe, expect, it } from "@stackra/testing";

import { readMigratedSchema } from "#node/functions/read-migrated-schema.function";

/** One transactional step. */
const step = (name: string, sql: string) => ({ name, sql, transactional: true });

const SETUP = [
  step(
    "0001_billing_0001_create",
    `create schema "billing";
     create table "billing"."invoices" ("id" varchar(33) primary key, "number" text not null, "paid_at" timestamptz, "tenant_id" varchar(33) not null);
     create table "billing"."invoice_lines" ("id" varchar(33) primary key, "invoice_id" varchar(33) not null);
     alter table "billing"."invoice_lines" add constraint "fk_invoice_lines_invoice_id" foreign key ("invoice_id") references "billing"."invoices" ("id");
     create unique index "idx_invoices_tenant_id_number" on "billing"."invoices" ("tenant_id", "number") where "paid_at" is null;
     create schema "other";
     create table "other"."things" ("id" int)`,
  ),
];

describe("readMigratedSchema", () => {
  it("reads columns, types, nullability, indexes and foreign keys of the listed schemas", async () => {
    const schema = await readMigratedSchema(SETUP, ["billing"]);

    expect(
      schema.columns
        .filter((column) => column.table === "invoices")
        .map((column) => [column.name, column.type, column.nullable]),
    ).toEqual([
      ["id", "character varying(33)", false],
      ["number", "text", false],
      ["paid_at", "timestamp with time zone", true],
      ["tenant_id", "character varying(33)", false],
    ]);
    expect(schema.indexes).toEqual([
      {
        schema: "billing",
        table: "invoices",
        name: "idx_invoices_tenant_id_number",
        columns: ["tenant_id", "number"],
        unique: true,
        method: "btree",
        predicate: "(paid_at IS NULL)",
      },
    ]);
    expect(schema.foreignKeys).toEqual([
      {
        schema: "billing",
        table: "invoice_lines",
        name: "fk_invoice_lines_invoice_id",
        columns: ["invoice_id"],
        referencedSchema: "billing",
        referencedTable: "invoices",
      },
    ]);
    expect(schema.columns.some((column) => column.schema === "other")).toBe(false);
  });

  it("names the file of a step that fails", async () => {
    await expect(
      readMigratedSchema([step("0001_billing_0001_bad", "create table (")], ["billing"]),
    ).rejects.toThrow(/^0001_billing_0001_bad failed:/);
  });
});
