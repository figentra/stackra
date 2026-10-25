/**
 * Stackra file contract:
 * Purpose: unit tests of `emitEntities`: each model's `[OptionalProps]` augmentation, one `EntitySchema` per model in
 *          the module's Postgres schema with its runtime facts (primary public id, `onUpdate`, nullability, enum items
 *          and constant defaults, integer columns, embedded money), its relations (a one-to-many `mappedBy` its
 *          inverse, a many-to-one `ref` `inversedBy` the other side, a link to another module's model by key), its
 *          getters as not persisted, the module's entity list and its `registerEntities` call; nothing for a module
 *          without a model.
 * Boundary: test only; runs on the billing IR fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0097 (decisions 3 and 5.4); ADR 0294 (decisions 20 and 28).
 */
import { describe, expect, it } from "@stackra/testing";

import { emitEntities } from "#core/functions/emit-entities.function";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

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
});
