/**
 * Stackra file contract:
 * Purpose: unit tests of `diffSchemas` and `formatSchemaDifference`: equal schemas have no difference (the invoicing
 *          unique index case included, a varchar for text and a rewritten predicate too), and each single mutation
 *          gives one difference of the right kind: a missing or undeclared table, column, index or foreign key, a
 *          nullability or type change, an unmapped type, an index of another shape; implied columns and indexes are
 *          tolerated, other modules are not compared, and a difference prints as one line.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159; ADR 0231; STA-1808.
 */
import { describe, expect, it } from "@stackra/testing";

import { diffSchemas } from "#core/functions/diff-schemas.function";
import { formatSchemaDifference } from "#core/functions/format-schema-difference.function";
import type { SchemaSnapshot } from "#core/types/schema-snapshot.type";

/** A column of `tax_documents` in module `invoicing`. */
const column = (name: string, type: string | undefined, nullable = false) => ({
  schema: "invoicing",
  table: "tax_documents",
  name,
  ...(type === undefined ? {} : { type }),
  nullable,
});

/** The unique index of the invoicing gate. */
const UNIQUE = {
  schema: "invoicing",
  table: "tax_documents",
  name: "idx_tax_documents_tenant_id_source_key_channel",
  columns: ["tenant_id", "source_key", "channel"],
  unique: true,
  method: "btree",
};

/** What the models of the fixture declare. */
const EXPECTED: SchemaSnapshot = {
  columns: [
    column("id", "varchar(33)"),
    column("tenant_id", "varchar(33)"),
    column("source_key", "text"),
    column("channel", "text"),
    column("due_at", "timestamptz", true),
  ],
  indexes: [UNIQUE],
  foreignKeys: [],
};

/** What the migrations build for the same fixture, as Postgres prints it. */
const ACTUAL: SchemaSnapshot = {
  columns: [
    column("id", "character varying(33)"),
    column("tenant_id", "character varying(33)"),
    column("source_key", "character varying(64)"),
    column("channel", "text"),
    column("due_at", "timestamp with time zone", true),
  ],
  indexes: [
    UNIQUE,
    { ...UNIQUE, name: "idx_tax_documents_tenant_id", columns: ["tenant_id"], unique: false },
  ],
  foreignKeys: [],
};

/** The unique index with a partial predicate. */
const where = (predicate: string) => ({ ...UNIQUE, predicate });

const diff = (expected: SchemaSnapshot, actual: SchemaSnapshot) =>
  diffSchemas(expected, actual, ["invoicing"]);

describe("diffSchemas", () => {
  it("finds no difference when the migrations build what the models declare", () => {
    expect(diff(EXPECTED, ACTUAL)).toEqual([]);
  });

  it("agrees on a partial index whose predicate Postgres rewrites", () => {
    expect(
      diff(
        { ...EXPECTED, indexes: [where("deleted_at is null")] },
        { ...ACTUAL, indexes: [where("(deleted_at IS NULL)")] },
      ),
    ).toEqual([]);
  });

  it("reports a column the models add that no migration builds", () => {
    const [difference] = diff(
      { ...EXPECTED, columns: [...EXPECTED.columns, column("paid_at", "timestamptz", true)] },
      ACTUAL,
    );

    expect(difference).toEqual({
      module: "invoicing",
      table: "tax_documents",
      kind: "missing_column",
      subject: "paid_at",
      expected: "timestamptz",
      actual: "-",
    });
    expect(formatSchemaDifference(difference as NonNullable<typeof difference>)).toBe(
      "invoicing  tax_documents  missing_column  paid_at  timestamptz  -",
    );
  });

  it("reports a migrated column no model declares, but not a macro's search column", () => {
    const columns = [
      ...ACTUAL.columns,
      column("legacy", "text", true),
      column("search_vector", "tsvector", true),
    ];

    expect(diff(EXPECTED, { ...ACTUAL, columns }).map((each) => [each.kind, each.subject])).toEqual(
      [["undeclared_column", "legacy"]],
    );
  });

  it("reports a nullability change and a type change", () => {
    const columns = ACTUAL.columns.map((each) =>
      each.name === "due_at"
        ? { ...each, nullable: false }
        : each.name === "channel"
          ? { ...each, type: "integer" }
          : each,
    );

    expect(diff(EXPECTED, { ...ACTUAL, columns }).map((each) => [each.kind, each.subject])).toEqual(
      [
        ["column_type", "channel"],
        ["nullability", "due_at"],
      ],
    );
  });

  it("reports a field type with no mapping as type_unmapped, with the migrated type", () => {
    const columns = EXPECTED.columns.map((each) =>
      each.name === "channel" ? column("channel", undefined) : each,
    );

    expect(diff({ ...EXPECTED, columns }, ACTUAL)).toEqual([
      {
        module: "invoicing",
        table: "tax_documents",
        kind: "type_unmapped",
        subject: "channel",
        expected: "-",
        actual: "text",
      },
    ]);
  });

  it("reports a missing index, an index of another shape and an undeclared one", () => {
    const missing = diff(EXPECTED, { ...ACTUAL, indexes: [] });
    const shape = diff(EXPECTED, {
      ...ACTUAL,
      indexes: [{ ...UNIQUE, unique: false }],
    });
    const undeclared = diff(EXPECTED, {
      ...ACTUAL,
      indexes: [
        ...ACTUAL.indexes,
        { ...UNIQUE, name: "idx_tax_documents_source_key", columns: ["source_key"], unique: false },
      ],
    });

    expect(missing.map((each) => [each.kind, each.subject])).toEqual([
      ["missing_index", UNIQUE.name],
    ]);
    expect(shape.map((each) => [each.kind, each.expected, each.actual])).toEqual([
      [
        "index_shape",
        "unique (tenant_id, source_key, channel)",
        "(tenant_id, source_key, channel)",
      ],
    ]);
    expect(undeclared.map((each) => [each.kind, each.subject])).toEqual([
      ["undeclared_index", "idx_tax_documents_source_key"],
    ]);
  });

  it("reports a missing and an undeclared foreign key", () => {
    const key = {
      schema: "invoicing",
      table: "tax_documents",
      name: "fk_tax_documents_customer_id",
      columns: ["customer_id"],
      referencedSchema: "invoicing",
      referencedTable: "customers",
    };

    expect(diff({ ...EXPECTED, foreignKeys: [key] }, ACTUAL).map((each) => each.kind)).toEqual([
      "missing_foreign_key",
    ]);
    expect(diff(EXPECTED, { ...ACTUAL, foreignKeys: [key] }).map((each) => each.kind)).toEqual([
      "undeclared_foreign_key",
    ]);
  });

  it("reports a model with no table and a table with no model", () => {
    const other = { ...column("id", "varchar(33)"), table: "credit_notes" };

    expect(
      diff({ ...EXPECTED, columns: [...EXPECTED.columns, other] }, ACTUAL).map((each) => [
        each.kind,
        each.table,
      ]),
    ).toEqual([["missing_table", "credit_notes"]]);
    expect(
      diff(EXPECTED, { ...ACTUAL, columns: [...ACTUAL.columns, other] }).map((each) => [
        each.kind,
        each.table,
      ]),
    ).toEqual([["undeclared_table", "credit_notes"]]);
  });

  it("compares only the given modules", () => {
    const elsewhere = { ...column("id", "varchar(33)"), schema: "search" };

    expect(diff(EXPECTED, { ...ACTUAL, columns: [...ACTUAL.columns, elsewhere] })).toEqual([]);
  });
});
