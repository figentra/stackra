/**
 * Stackra file contract:
 * Purpose: `BILLING_IR`, a service member that exercises the platform registrations as discovery would read it: the
 *          `billing` service with models and their entity facts (a one-to-many with its inverse, a link to a `crm`
 *          model, money, an enum default, a getter), a `CrudService<Invoice>`, a factory, injected `Repository<M>`,
 *          `Journal<M>` and `RequestContext`, an integration event sent as a webhook with a change, a scheduled job
 *          action, an Integration that receives webhooks with its connection and webhook event, a sequence, a
 *          `@Searchable` model, and `@stackra/segments` hosted with its manifest. The entity, registration, boot,
 *          webhook, prefix, wiring and tool-config tests run on it.
 * Boundary: test data only; never imported by package code.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0097; ADR 0141; ADR 0308; ADR 0342.
 */
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** A kind class of the fixture with every list empty unless given. */
function declared(
  name: string,
  kind: string,
  module: string,
  file: string,
  more: Partial<DeclaredClass> = {},
): DeclaredClass {
  return {
    name,
    kind,
    module,
    file,
    importPath: `#${file.replace(/^src\//, "").replace(/\.ts$/, "")}`,
    options: {},
    deps: [],
    facets: [],
    methods: [],
    refusals: [],
    statics: {},
    traits: [],
    ...more,
  };
}

/** Where the fixture's classes live. */
const INVOICE = "#modules/billing/models/invoice.model";
const INVOICE_LINE = "#modules/billing/models/invoice-line.model";
const CUSTOMER = "#modules/crm/models/customer.model";
const INVOICE_ISSUED = "#modules/billing/events/invoice-issued.event";
const STRIPE = "#modules/billing/integrations/stripe.integration";

/** The billing service, read. */
export const BILLING_IR: MemberIR = {
  member: "billing",
  package: "@acme/service-billing",
  version: "1.0.0",
  layout: "service",
  modules: ["billing", "crm"],
  classes: [
    declared(
      "InvoicePermissions",
      "permissions",
      "billing",
      "src/modules/billing/access/invoice.permissions.ts",
      { statics: { read: "Permission.L0", sendReminders: "Permission.L1" } },
    ),
    declared(
      "SendRemindersAction",
      "action",
      "billing",
      "src/modules/billing/actions/send-reminders.action.ts",
      {
        options: {
          key: "invoice.send_reminders",
          actors: ["system"],
          job: { queue: "default", cron: { schedule: "0 9 * * *" } },
        },
        methods: ["handle"],
      },
    ),
    declared(
      "InvoiceIssuedChange",
      "change",
      "billing",
      "src/modules/billing/events/invoice-issued.change.ts",
      {
        options: { from: 1 },
        partner: { name: "InvoiceIssued", kind: "integration_event", from: INVOICE_ISSUED },
      },
    ),
    declared(
      "InvoiceIssued",
      "integration_event",
      "billing",
      "src/modules/billing/events/invoice-issued.event.ts",
      { options: { name: "invoice.issued", version: 2, webhook: true } },
    ),
    declared(
      "StripeConnection",
      "connection",
      "billing",
      "src/modules/billing/connections/stripe.connection.ts",
      { partner: { name: "StripeIntegration", kind: "integration", from: STRIPE } },
    ),
    declared(
      "StripePaymentSucceeded",
      "webhook_event",
      "billing",
      "src/modules/billing/events/stripe-payment-succeeded.event.ts",
      {
        options: { type: "payment_intent.succeeded" },
        partner: { name: "StripeIntegration", kind: "integration", from: STRIPE },
      },
    ),
    declared(
      "StripeIntegration",
      "integration",
      "billing",
      "src/modules/billing/integrations/stripe.integration.ts",
      { options: { webhooks: { scheme: "stripe" } } },
    ),
    declared("InvoiceLine", "model", "billing", "src/modules/billing/models/invoice-line.model.ts"),
    declared("Invoice", "model", "billing", "src/modules/billing/models/invoice.model.ts", {
      traits: [
        { name: "HasPublicId", args: ["inv"] },
        { name: "Timestamps", args: [] },
      ],
      facets: [
        {
          name: "Searchable",
          kind: "searchable",
          target: "class",
          options: {},
          from: "@stackra/model",
        },
      ],
    }),
    declared(
      "InvoiceFactory",
      "factory",
      "billing",
      "src/modules/billing/database/factories/invoice.factory.ts",
      { partner: { name: "Invoice", kind: "model", from: INVOICE } },
    ),
    declared(
      "InvoiceSequence",
      "sequence",
      "billing",
      "src/modules/billing/database/sequences/invoice.sequence.ts",
      { options: { key: "invoice", format: "INV-{n:06}" } },
    ),
    declared(
      "InvoiceService",
      "service",
      "billing",
      "src/modules/billing/services/invoice.service.ts",
      {
        partner: { name: "Invoice", kind: "model", from: INVOICE },
        deps: [
          {
            class: { name: "Invoice", from: INVOICE },
            of: { name: "repositoryOf", from: "@stackra/database" },
          },
        ],
      },
    ),
    declared(
      "PostingService",
      "service",
      "billing",
      "src/modules/billing/services/posting.service.ts",
      {
        deps: [
          {
            class: { name: "Invoice", from: INVOICE },
            of: { name: "journalOf", from: "@stackra/ledger" },
          },
        ],
      },
    ),
    declared(
      "ReportService",
      "service",
      "billing",
      "src/modules/billing/services/report.service.ts",
      { deps: [{ class: { name: "RequestContext", from: "@stackra/actions" } }] },
    ),
    declared("Customer", "model", "crm", "src/modules/crm/models/customer.model.ts", {
      traits: [{ name: "HasPublicId", args: ["cus"] }],
    }),
  ],
  shapes: [
    {
      name: "InvoiceLine",
      kind: "model",
      module: "billing",
      file: "src/modules/billing/models/invoice-line.model.ts",
      importPath: INVOICE_LINE,
      fields: [
        {
          name: "quantity",
          optional: false,
          nullable: false,
          type: { kind: "number" },
          rules: [{ name: "Int", options: { min: 1 } }],
        },
      ],
      relations: ["invoice"],
      entity: {
        optional: [],
        relations: [
          {
            name: "invoice",
            kind: "m:1",
            target: { name: "Invoice", from: INVOICE },
            targetModule: "billing",
            nullable: false,
            ref: true,
            options: { onDelete: "cascade" },
          },
        ],
        computed: [],
      },
    },
    {
      name: "Invoice",
      kind: "model",
      module: "billing",
      file: "src/modules/billing/models/invoice.model.ts",
      importPath: INVOICE,
      fields: [
        { name: "number", optional: false, nullable: false, type: { kind: "string" }, rules: [] },
        {
          name: "status",
          optional: false,
          nullable: false,
          type: { kind: "enum", name: "InvoiceStatus", values: ["draft", "issued"] },
          rules: [],
          default: { value: "draft", code: '"draft"', imports: [] },
        },
        { name: "total", optional: false, nullable: false, type: { kind: "money" }, rules: [] },
        { name: "paidAt", optional: false, nullable: true, type: { kind: "date" }, rules: [] },
        {
          name: "id",
          optional: false,
          nullable: false,
          type: { kind: "public_id", prefix: "inv" },
          rules: [],
        },
        { name: "createdAt", optional: false, nullable: false, type: { kind: "date" }, rules: [] },
        { name: "updatedAt", optional: false, nullable: false, type: { kind: "date" }, rules: [] },
      ],
      relations: ["lines", "customer"],
      entity: {
        optional: ["createdAt", "id", "lines", "status", "updatedAt"],
        relations: [
          {
            name: "lines",
            kind: "1:m",
            target: { name: "InvoiceLine", from: INVOICE_LINE },
            targetModule: "billing",
            nullable: false,
            ref: false,
            inverse: "invoice",
            options: { orphanRemoval: true },
          },
          {
            name: "customer",
            kind: "link",
            target: { name: "Customer", from: CUSTOMER },
            targetModule: "crm",
            nullable: true,
            ref: false,
            options: {},
          },
        ],
        computed: ["isPaid"],
      },
    },
    {
      name: "Customer",
      kind: "model",
      module: "crm",
      file: "src/modules/crm/models/customer.model.ts",
      importPath: CUSTOMER,
      fields: [
        {
          name: "id",
          optional: false,
          nullable: false,
          type: { kind: "public_id", prefix: "cus" },
          rules: [],
        },
      ],
      relations: [],
      entity: { optional: ["id"], relations: [], computed: [] },
    },
  ],
  enums: [],
  files: [],
  packages: ["@stackra/database", "@stackra/outbox", "@stackra/segments"],
  dependencies: [
    {
      package: "@stackra/segments",
      manifest: {
        member: "segments",
        package: "@stackra/segments",
        version: "0.1.0",
        modules: [{ key: "segments", class: "SegmentsModule", exports: [], dependsOn: [] }],
        models: [
          {
            key: "segments.segment",
            class: "Segment",
            file: "src/node/models/segment.model.ts",
            table: "segments.segments",
            publicId: "seg",
            traits: ["HasPublicId"],
          },
        ],
        sequences: [
          {
            key: "segments.export",
            class: "SegmentExportSequence",
            module: "segments",
            file: "src/node/database/sequences/segment-export.sequence.ts",
          },
        ],
      },
    },
  ],
  errors: [],
};
