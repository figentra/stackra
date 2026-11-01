/**
 * Stackra file contract:
 * Purpose: unit tests of `expectedSchema`: a model gives its table in its module's schema with data and trait columns,
 *          nullability and mapped types, a `Money` as two columns, an unmapped field with no type, relation columns and
 *          the same-module foreign key (a link has none), an `@Index` under its derived name with `unique` and
 *          `where`, a base model's fields and indexes, and no table for an abstract model; a side table has its id.
 * Boundary: test only; pure IR in, schema out.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 20 and 28); ADR 0231; STA-1808.
 */
import { describe, expect, it } from "@stackra/testing";

import { expectedSchema } from "#core/functions/expected-schema.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { FacetUse } from "#core/types/facet-use.type";
import type { FieldIR } from "#core/types/field-ir.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { RelationIR } from "#core/types/relation-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";
import type { TypeDesc } from "#core/types/type-desc.type";

/** A field. */
const field = (name: string, type: TypeDesc, extra: Partial<FieldIR> = {}): FieldIR => ({
  name,
  optional: false,
  nullable: false,
  type,
  rules: [],
  ...extra,
});

/** An `@Index` facet. */
const index = (properties: readonly string[], rest?: object): FacetUse => ({
  name: "Index",
  kind: "index",
  target: "class",
  options: properties,
  from: "@stackra/model",
  ...(rest === undefined ? {} : { rest: [rest] }),
});

/** A member with the given models: `[name, fields, relations, facets, extra]`. */
function member(
  models: readonly {
    readonly name: string;
    readonly fields: readonly FieldIR[];
    readonly relations?: readonly RelationIR[];
    readonly facets?: readonly FacetUse[];
    readonly base?: string;
    readonly kind?: string;
    readonly abstract?: true;
  }[],
): MemberIR {
  const shapes = models.map((model): ShapeIR => ({
    name: model.name,
    kind: model.kind ?? "model",
    module: "billing",
    file: `src/modules/billing/models/${model.name}.model.ts`,
    importPath: `#modules/billing/models/${model.name}.model`,
    fields: model.fields,
    relations: [],
    ...(model.base === undefined
      ? {}
      : { base: { kind: "member" as const, name: model.base, module: "billing" } }),
    entity: { optional: [], relations: model.relations ?? [], computed: [] },
  }));
  const classes = models.map(
    (model): DeclaredClass =>
      ({
        name: model.name,
        kind: model.kind ?? "model",
        module: "billing",
        file: `src/modules/billing/models/${model.name}.model.ts`,
        importPath: `#modules/billing/models/${model.name}.model`,
        options: {},
        deps: [],
        facets: model.facets ?? [],
        methods: [],
        refusals: [],
        statics: {},
        traits: [],
        ...(model.base === undefined ? {} : { base: { name: model.base, from: "#x", own: true } }),
        ...(model.abstract === true ? { abstract: true as const } : {}),
      }) as DeclaredClass,
  );
  return { member: "billing", modules: ["billing"], shapes, classes } as unknown as MemberIR;
}

const ID = field("id", { kind: "public_id", prefix: "inv" });
// `| undefined` lets a case clear a default (a link with no targetModule) under exactOptionalPropertyTypes.
const relation = (
  name: string,
  kind: RelationIR["kind"],
  extra: { [K in keyof RelationIR]?: RelationIR[K] | undefined } = {},
) =>
  ({
    name,
    kind,
    target: { name: "Customer", from: "#c" },
    targetModule: "billing",
    nullable: false,
    ref: false,
    options: {},
    ...extra,
  }) as RelationIR;

describe("expectedSchema", () => {
  it("builds a table with data and trait columns, nullability and types", () => {
    const schema = expectedSchema(
      member([
        {
          name: "TaxDocument",
          fields: [
            ID,
            field("sourceKey", { kind: "string" }),
            field("dueAt", { kind: "date" }, { nullable: true }),
            field("total", { kind: "money" }),
            field("note", { kind: "duration" }, { optional: true }),
          ],
        },
      ]),
    );

    expect(
      schema.columns.map((column) => [
        column.schema,
        column.table,
        column.name,
        column.type,
        column.nullable,
      ]),
    ).toEqual([
      ["billing", "tax_documents", "id", "varchar(33)", false],
      ["billing", "tax_documents", "source_key", "text", false],
      ["billing", "tax_documents", "due_at", "timestamptz", true],
      ["billing", "tax_documents", "total_minor", "bigint", false],
      ["billing", "tax_documents", "total_currency", "char(3)", false],
      ["billing", "tax_documents", "note", undefined, true],
    ]);
  });

  it("derives the name of an @Index, with unique and where, and maps relations to columns", () => {
    const schema = expectedSchema(
      member([
        {
          name: "TaxDocument",
          fields: [ID, field("tenantId", { kind: "public_id", prefix: "scp" })],
          relations: [relation("customer", "m:1")],
          facets: [
            index(["tenantId", "sourceKey", "channel"], { unique: true }),
            index(["customer"]),
            index(["total.minor"], { where: "deleted_at is null" }),
          ],
        },
      ]),
    );

    expect(schema.indexes).toEqual([
      {
        schema: "billing",
        table: "tax_documents",
        name: "idx_tax_documents_tenant_id_source_key_channel",
        columns: ["tenant_id", "source_key", "channel"],
        unique: true,
        predicate: undefined,
      },
      {
        schema: "billing",
        table: "tax_documents",
        name: "idx_tax_documents_customer_id",
        columns: ["customer_id"],
        unique: false,
        predicate: undefined,
      },
      {
        schema: "billing",
        table: "tax_documents",
        name: "idx_tax_documents_total_minor",
        columns: ["total_minor"],
        unique: false,
        predicate: "deleted_at is null",
      },
    ]);
  });

  it("gives an owning relation a varchar(33) column and a same-module foreign key, and a link none", () => {
    const schema = expectedSchema(
      member([
        {
          name: "Invoice",
          fields: [ID],
          relations: [
            relation("customer", "m:1", { nullable: true }),
            relation("owner", "link", { targetModule: undefined }),
            relation("lines", "1:m"),
            relation("profile", "1:1", { inverse: "invoice" }),
          ],
        },
      ]),
    );

    expect(schema.columns.map((column) => [column.name, column.type, column.nullable])).toEqual([
      ["id", "varchar(33)", false],
      ["customer_id", "varchar(33)", true],
      ["owner_id", "varchar(33)", false],
    ]);
    expect(schema.foreignKeys).toEqual([
      {
        schema: "billing",
        table: "invoices",
        name: "fk_invoices_customer_id",
        columns: ["customer_id"],
        referencedSchema: "billing",
        referencedTable: "customers",
      },
    ]);
  });

  it("reads fields and indexes through an own base model, and skips an abstract model", () => {
    const schema = expectedSchema(
      member([
        { name: "Document", fields: [ID], facets: [index(["number"])], abstract: true },
        { name: "Invoice", fields: [field("number", { kind: "string" })], base: "Document" },
      ]),
    );

    expect(schema.columns.map((column) => `${column.table}.${column.name}`)).toEqual([
      "invoices.id",
      "invoices.number",
    ]);
    expect(schema.indexes.map((each) => each.name)).toEqual(["idx_invoices_number"]);
  });

  it("gives a model addition's side table its id column", () => {
    const schema = expectedSchema(
      member([
        {
          name: "InvoiceExtra",
          kind: "model_addition",
          fields: [field("memo", { kind: "string" })],
        },
      ]),
    );

    expect(schema.columns.map((column) => [column.table, column.name, column.type])).toEqual([
      ["invoice_extras", "id", "varchar(33)"],
      ["invoice_extras", "memo", "text"],
    ]);
  });
});
