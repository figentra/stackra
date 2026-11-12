/**
 * Stackra file contract:
 * Purpose: unit tests of `emitEntities`: each model's `[OptionalProps]` augmentation, one `EntitySchema` per model in
 *          the module's Postgres schema with its runtime facts (primary public id, `onUpdate`, nullability, enum items
 *          and constant defaults, integer columns, embedded money), its relations (a one-to-many `mappedBy` its
 *          inverse, a many-to-one `ref` `inversedBy` the other side, a link to another module's model by key), its
 *          getters as not persisted, the module's entity list and its `registerEntities` call; nothing for a module
 *          without a model; a translated field typed with `TranslatedType` (STA-1218); a `@Field(zod)` hatch field typed
 *          from its migration column (`t.enum` is `string`, `t.integer` `integer`, ...), `json` when no column is found.
 * Boundary: test only; runs on the billing IR fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0097 (decisions 3 and 5.4); ADR 0294 (decisions 20 and 28);
 *                     ADR 0162 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { emitEntities } from "#core/functions/emit-entities.function";
import type { MemberIR } from "#core/types/member-ir.type";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

/** A model field of the geo kind (ADR 0314). */
const geo = (name: string, shape: "point" | "polygon" | "line", nullable: boolean) => ({
  name,
  optional: false,
  nullable,
  type: { kind: "geo" as const, shape },
  rules: [],
});

/** A `@Field(zod)` hatch field named `name`. */
const hatchField = (name: string) => ({
  name,
  optional: false,
  nullable: false,
  type: { kind: "hatch" as const, source: "z.enum" },
  rules: [],
});

describe("emitEntities", () => {
  const billing = emitEntities(BILLING_IR, "billing") ?? "";

  it("augments each model with the keys a create may leave out", () => {
    expect(billing).toContain(
      'import { EntitySchema, type OptionalProps, registerEntities } from "@stackra/database";',
    );
    expect(billing).toContain(
      [
        'declare module "#modules/billing/models/invoice.model" {',
        "  interface Invoice {",
        '    [OptionalProps]?: "createdAt" | "id" | "lines" | "status" | "updatedAt";',
        "  }",
        "}",
      ].join("\n"),
    );
    expect(billing).not.toContain("interface InvoiceLine {");
  });

  it("writes one EntitySchema per model with its runtime facts", () => {
    expect(billing).toContain("export const InvoiceSchema = new EntitySchema<Invoice>({");
    // A service's `Invoice` carries the `"~defaults"` marker its schemas file adds, which EntitySchema<T> requires a
    // key for; a package's committed list is checked without that file, so its `T` has no such key (TS2353).
    const asService = emitEntities({ ...BILLING_IR, layout: "service" }, "billing") ?? "";
    const asPackage = emitEntities({ ...BILLING_IR, layout: "package" }, "billing") ?? "";
    expect(asService).toContain('    "~defaults": { type: "json", persist: false },');
    expect(asPackage).not.toContain("~defaults");
    expect(billing).toContain('  schema: "billing",');
    expect(billing).toContain('  tableName: "invoices",');
    expect(billing).toContain('  tableName: "invoice_lines",');
    expect(billing).toContain('    number: { type: "string" },');
    expect(billing).toContain(
      '    status: { enum: true, items: ["draft","issued"], default: "draft" },',
    );
    expect(billing).toContain(
      '    total: { kind: "embedded", entity: () => MoneySchema, prefix: "total_" },',
    );
    expect(billing).toContain('    paidAt: { type: "datetime", nullable: true },');
    expect(billing).toContain('    id: { type: "string", primary: true },');
    expect(billing).toContain('    updatedAt: { type: "datetime", onUpdate: () => new Date() },');
    expect(billing).toContain('    quantity: { type: "integer" },');
  });

  it("writes relations, links and getters", () => {
    expect(billing).toContain(
      '    lines: { kind: "1:m", entity: () => InvoiceLine, mappedBy: "invoice", orphanRemoval: true },',
    );
    expect(billing).toContain(
      '    invoice: { kind: "m:1", entity: () => Invoice, ref: true, inversedBy: "lines" },',
    );
    expect(billing).toContain(
      '    customer: { type: new LinkType("crm.customer"), fieldName: "customer_id", nullable: true },',
    );
    expect(billing).toContain('    isPaid: { type: "json", persist: false },');
    expect(billing).toContain('import { LinkType, MoneySchema } from "@stackra/model";');
  });

  it("lists and registers the module's entities", () => {
    expect(billing).toContain(
      "export const BILLING_ENTITIES: readonly EntitySchema[] = [MoneySchema, InvoiceLineSchema, InvoiceSchema];",
    );
    expect(billing).toContain("registerEntities(BILLING_ENTITIES);");
    expect(emitEntities(BILLING_IR, "crm")).toContain(
      "export const CRM_ENTITIES: readonly EntitySchema[] = [CustomerSchema];",
    );
  });

  it("writes nothing for a module without a model", () => {
    expect(emitEntities(COMMERCE_IR, "orders")).toBeUndefined();
  });

  it("types a translated field with TranslatedType", () => {
    const ir: MemberIR = {
      ...BILLING_IR,
      shapes: [
        {
          name: "Badge",
          kind: "model",
          module: "billing",
          file: "src/modules/billing/models/badge.model.ts",
          importPath: "#modules/billing/models/badge.model",
          fields: [
            {
              name: "label",
              optional: false,
              nullable: true,
              type: { kind: "translated", form: "value" },
              rules: [],
            },
          ],
          relations: [],
        },
      ],
      classes: [],
    };
    const content = emitEntities(ir, "billing") ?? "";
    expect(content).toContain('import { TranslatedType } from "@stackra/model";');
    expect(content).toContain("    label: { type: TranslatedType, nullable: true },");
  });

  it("types a GeoPoint, GeoPolygon or GeoLine field with its geography column type (ADR 0314)", () => {
    const ir: MemberIR = {
      ...BILLING_IR,
      shapes: [
        {
          name: "Depot",
          kind: "model",
          module: "billing",
          file: "src/modules/billing/models/depot.model.ts",
          importPath: "#modules/billing/models/depot.model",
          fields: [
            geo("location", "point", false),
            geo("area", "polygon", true),
            geo("route", "line", true),
          ],
          relations: [],
        },
      ],
      classes: [],
    };
    const content = emitEntities(ir, "billing") ?? "";
    expect(content).toMatch(
      /import \{ GeoLineType, GeoPointType, GeoPolygonType \} from "@stackra\/model";/,
    );
    expect(content).toContain("    location: { type: GeoPointType },");
    expect(content).toContain("    area: { type: GeoPolygonType, nullable: true },");
    expect(content).toContain("    route: { type: GeoLineType, nullable: true },");
  });

  it("types a @Field(zod) hatch field from its migration column, and json when none is found", () => {
    const columns = [
      { name: "outcome", method: "enum" },
      { name: "closed_on", method: "string" },
      { name: "attempts", method: "integer" },
      { name: "is_open", method: "boolean" },
      { name: "seen_at", method: "timestamp" },
      { name: "extra", method: "jsonb" },
    ];
    const ir: MemberIR = {
      ...BILLING_IR,
      shapes: [
        {
          name: "Entry",
          kind: "model",
          module: "billing",
          file: "src/modules/billing/models/entry.model.ts",
          importPath: "#modules/billing/models/entry.model",
          fields: ["outcome", "closedOn", "attempts", "isOpen", "seenAt", "extra", "loose"].map(
            hatchField,
          ),
          relations: [],
        },
      ],
      classes: [],
      migrationTables: [
        {
          file: "src/modules/billing/database/migrations/0001-create-entries.migration.ts",
          module: "billing",
          table: "entries",
          ownerColumn: false,
          columns,
        },
      ],
    };
    const content = emitEntities(ir, "billing") ?? "";
    expect(content).toContain('    outcome: { type: "string" },');
    expect(content).toContain('    closedOn: { type: "string" },');
    expect(content).toContain('    attempts: { type: "integer" },');
    expect(content).toContain('    isOpen: { type: "boolean" },');
    expect(content).toContain('    seenAt: { type: "datetime" },');
    expect(content).toContain('    extra: { type: "json" },');
    expect(content).toContain('    loose: { type: "json" },');
  });
});
