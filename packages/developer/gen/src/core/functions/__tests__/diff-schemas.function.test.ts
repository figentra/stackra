/**
 * Stackra file contract:
 * Purpose: unit tests of `diffSchemas` and `formatSchemaDifference`: equal schemas have no difference (the invoicing
 *          unique index case included, a varchar for text and a rewritten predicate too), and each single mutation
 *          gives one difference of the right kind: a missing or undeclared table, column, index or foreign key, a
 *          nullability or type change, an unmapped type, an index of another shape; implied columns and indexes are
 *          tolerated, other modules are not compared, and a difference prints as one line; a migrated pivot agrees
 *          and an absent one is missing; search columns are expected on a searchable table and undeclared elsewhere;
 *          each predicate Postgres rewrites agrees and a predicate of another meaning is `index_shape`.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159; ADR 0231; ADR 0221; STA-1808; STA-2071.
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

/** A column of the pivot `products_collections`. */
const pivot = (name: string) => ({
  ...column(name, "varchar(33)"),
  table: "products_collections",
});

/** A foreign key of the pivot `products_collections`. */
const pivotKey = (name: string, referencedTable: string) => ({
  schema: "invoicing",
  table: "products_collections",
  name: `fk_products_collections_${name}`,
  columns: [name],
  referencedSchema: "invoicing",
  referencedTable,
});

/** A search index of `tax_documents`. */
const searchIndex = (name: string, columns: readonly string[]) => ({
  ...UNIQUE,
  name,
  columns,
  unique: false,
  method: "gin",
});

/** The difference kinds of one partial index whose predicate is `source` in the model and `rendered` migrated. */
const agrees = (source: string, rendered: string) =>
  diff({ ...EXPECTED, indexes: [where(source)] }, { ...ACTUAL, indexes: [where(rendered)] }).map(
    (each) => each.kind,
  );

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

  it("reports a migrated column no model declares, but not a trait's column", () => {
    const columns = [
      ...ACTUAL.columns,
      column("legacy", "text", true),
      column("tree_path", "text", true),
      column("metadata", "jsonb", true),
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

  // @covers sta-2071:FR-001
  it("agrees on a migrated pivot with its key indexes, and reports an absent one as missing_table", () => {
    const expected: SchemaSnapshot = {
      ...EXPECTED,
      columns: [...EXPECTED.columns, pivot("product_id"), pivot("product_collection_id")],
      foreignKeys: [
        pivotKey("product_id", "products"),
        pivotKey("product_collection_id", "product_collections"),
      ],
    };
    const actual: SchemaSnapshot = {
      columns: [
        ...ACTUAL.columns,
        { ...pivot("product_id"), type: "character varying(33)" },
        { ...pivot("product_collection_id"), type: "character varying(33)" },
      ],
      indexes: [
        ...ACTUAL.indexes,
        {
          ...UNIQUE,
          table: "products_collections",
          name: "idx_products_collections_product_id",
          columns: ["product_id"],
          unique: false,
        },
      ],
      foreignKeys: expected.foreignKeys,
    };

    expect(diff(expected, actual)).toEqual([]);
    expect(diff(expected, ACTUAL).map((each) => [each.kind, each.table])).toEqual([
      ["missing_table", "products_collections"],
    ]);
  });

  describe("search columns", () => {
    const SEARCHABLE: SchemaSnapshot = {
      ...EXPECTED,
      columns: [
        ...EXPECTED.columns,
        column("search_text", "text", true),
        column("search_filters", "jsonb", true),
      ],
    };
    const MIGRATED: SchemaSnapshot = {
      ...ACTUAL,
      columns: [
        ...ACTUAL.columns,
        column("search_vector_en_us", "tsvector", true),
        column("search_vector_ar_sa", "tsvector", true),
        column("search_text", "text", true),
        column("search_filters", "jsonb", true),
        column("search_vector__v2", "tsvector", true),
        column("search_text__v2", "text", true),
        column("search_filters__v2", "jsonb", true),
      ],
      indexes: [
        ...ACTUAL.indexes,
        searchIndex("idx_tax_documents_search_vector_en_us", ["search_vector_en_us"]),
        searchIndex("idx_tax_documents_search_text", ["search_text"]),
        searchIndex("idx_tax_documents_search_filters", ["search_filters"]),
      ],
    };

    // @covers sta-2071:FR-006
    it("tolerates per-locale vectors, shadows and search indexes on a searchable table", () => {
      expect(diff(SEARCHABLE, MIGRATED)).toEqual([]);
    });

    // @covers sta-2071:FR-005
    it("reports a searchable table's absent search columns as missing_column", () => {
      expect(diff(SEARCHABLE, ACTUAL).map((each) => [each.kind, each.subject])).toEqual([
        ["missing_column", "search_filters"],
        ["missing_column", "search_text"],
      ]);
    });

    // @covers sta-2071:FR-006
    it("reports search columns on a table whose model is not searchable as undeclared_column", () => {
      const columns = [
        ...ACTUAL.columns,
        column("search_vector", "tsvector", true),
        column("search_text", "text", true),
        column("search_filters", "jsonb", true),
      ];

      expect(
        diff(EXPECTED, { ...ACTUAL, columns }).map((each) => [each.kind, each.subject]),
      ).toEqual([
        ["undeclared_column", "search_filters"],
        ["undeclared_column", "search_text"],
        ["undeclared_column", "search_vector"],
      ]);
    });
  });

  describe("partial index predicates", () => {
    // @covers sta-2071:FR-007
    it.each([
      ["a cast", "kind = 'a'", "((kind)::text = 'a'::text)"],
      ["a multi-word cast", "kind = 'a'", "(kind = 'a'::character varying)"],
      [
        "a timestamp cast",
        "starts_at < ends_at",
        "(starts_at < (ends_at)::timestamp with time zone)",
      ],
      ["an array cast", "tags = '{}'", "(tags = '{}'::text[])"],
      [
        "a cast followed by more of the predicate",
        "status = 'a' and deleted_at is null",
        "status = 'a'::text and deleted_at is null",
      ],
      ["a quoted identifier", "order > 0", '("order" > 0)'],
      ["!= as <>", "status != 'void'", "((status)::text <> 'void'::text)"],
      [
        "in as = ANY",
        "status in ('active', 'paused')",
        "(status = ANY (ARRAY['active'::text, 'paused'::text]))",
      ],
      [
        "in over a varchar as = ANY of a cast array",
        "status in ('active', 'paused')",
        "((status)::text = ANY ((ARRAY['active'::character varying, 'paused'::character varying])::text[]))",
      ],
      [
        "not in as <> ALL",
        "status not in ('void', 'draft')",
        "(status <> ALL (ARRAY['void'::text, 'draft'::text]))",
      ],
      ["like as ~~", "email like '%@x.com'", "(email ~~ '%@x.com'::text)"],
      ["ilike as ~~*", "email ilike 'a%'", "(email ~~* 'a%'::text)"],
      ["not like as !~~", "email not like 'a%'", "(email !~~ 'a%'::text)"],
      ["not ilike as !~~*", "email not ilike 'a%'", "(email !~~* 'a%'::text)"],
      [
        "between as two comparisons",
        "quantity between 1 and 5",
        "((quantity >= 1) AND (quantity <= 5))",
      ],
    ])("agrees on %s", (_, source, rendered) => {
      expect(agrees(source, rendered)).toEqual([]);
    });

    // @covers sta-2071:FR-008
    it.each([
      ["another value", "status = 'a'", "(status = 'b'::text)"],
      ["another operator", "status = 'a'", "(status <> 'a'::text)"],
      ["like against ilike", "email like 'a%'", "(email ~~* 'a%'::text)"],
      [
        "in against not in",
        "status in ('a', 'b')",
        "(status <> ALL (ARRAY['a'::text, 'b'::text]))",
      ],
      ["and against or", "a is null and b is null", "((a IS NULL) OR (b IS NULL))"],
      ["the words after a cast", "status = 'a'", "status = 'a'::text and deleted_at is null"],
    ])("reports %s as index_shape", (_, source, rendered) => {
      expect(agrees(source, rendered)).toEqual(["index_shape"]);
    });
  });
});
