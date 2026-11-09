/**
 * Stackra file contract:
 * Purpose: unit tests of `emitRegistrations`: the generated entity and schemas files loaded first, then one call per
 *          platform registration with a row each, from the locked identities: the hosted packages' entity lists, the
 *          model partners of each `CrudService<M>` (and of each one its packages' manifests list with its model), event wire names, jobs for the queue and the scheduler,
 *          connections, webhook events, outbound webhooks, sequences (a hosted package's imported from its entry),
 *          entitlements with the calls they gate (STA-903) and searchable models; a listener with the event class it imports (its own, or a consumed service's, whose wire
 *          name comes from the producer's manifest) and a relay listener; no file for an app or a member with nothing
 *          to register; every Permission static (system and restricted included) and module role by its locked key,
 *          permissions first (STA-1702); each record policy with its model, own and hosted (STA-2045); a hosted
 *          package's webhook events with their Integration and Connection from its manifest, an own event typed
 *          against a hosted Integration with that Integration's hosted Connection, a service listener of a hosted
 *          event, and no change for a host without hosted webhook events.
 * Boundary: test only; runs on the IR fixtures and the manifests `buildManifest` derives from them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 20 and 22); ADR 0097; ADR 0141; ADR 0308;
 *                     ADR 0342; ADR 0260 (decision 4); STA-1387 (event names from @stackra/events).
 */
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { emitRegistrations } from "#core/functions/emit-registrations.function";
import { emitWebhooks } from "#core/functions/emit-webhooks.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { CONNECTOR_PACKAGES } from "#core/__tests__/fixtures/connector-packages.fixture";
import { COURIER_PACKAGE_IR } from "#core/__tests__/fixtures/courier-package-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

/** The registrations of `ir` against its own derived manifest. */
function registrationsOf(ir: MemberIR): string | undefined {
  return emitRegistrations(ir, buildManifest(ir).manifest);
}

/** An extension of the orders module on `OrderExtensionPoint["adjustTotals"]`. */
const EXTENSION = {
  name: "TierBonusExtension",
  kind: "extension",
  module: "orders",
  file: "src/modules/orders/extensions/tier-bonus.extension.ts",
  importPath: "#modules/orders/extensions/tier-bonus.extension",
  options: { order: 200 },
  partner: {
    name: "OrderExtensionPoint",
    slot: "adjustTotals",
    from: "#modules/orders/extensions/order.extension-point",
  },
  deps: [],
  facets: [],
  methods: [],
  refusals: [],
  statics: {},
  traits: [],
} as const;

describe("emitRegistrations", () => {
  const billing = registrationsOf(BILLING_IR) ?? "";

  it("loads the generated entity and schemas files first", () => {
    const body = billing.slice(billing.indexOf("*/") + 3);
    expect(body.startsWith('import "#stackra/entities/billing";\n')).toBe(true);
    expect(body).toContain('import "#stackra/entities/crm";\nimport "#stackra/schemas/billing";');
    expect(body).toContain('import "#stackra/schemas/crm";');
  });

  it("registers hosted entities and model partners", () => {
    expect(billing).toContain("registerEntities([...SEGMENTS_ENTITIES]);");
    expect(billing).toMatch(
      /import \{[^}]*SEGMENTS_ENTITIES[^}]*\} from "@stackra\/segments\/node";/,
    );
    expect(billing).toContain("registerModelPartners([\n  [InvoiceService, Invoice],\n]);");
    expect(billing).not.toContain("InvoiceFactory");
  });

  it("registers the model partner of each CrudService a package's manifest lists with its model", () => {
    const content =
      registrationsOf({
        ...BILLING_IR,
        dependencies: [
          ...BILLING_IR.dependencies,
          {
            package: "@stackra/scope",
            manifest: {
              member: "scope",
              package: "@stackra/scope",
              version: "0.1.0",
              services: [
                {
                  class: "ScopeNodeService",
                  from: "@stackra/scope/node",
                  partner: { name: "ScopeNode", from: "@stackra/scope/node" },
                },
                { class: "ScopeTreeReader", from: "@stackra/scope/node" },
              ],
            },
          },
        ],
      }) ?? "";
    expect(content).toContain(
      "registerModelPartners([\n  [InvoiceService, Invoice],\n  [ScopeNodeService, ScopeNode],\n]);",
    );
    expect(content).toMatch(
      /import \{[^}]*\bScopeNodeService\b[^}]*\} from "@stackra\/scope\/node";/,
    );
    expect(content).toMatch(/import \{[^}]*\bScopeNode\b[^}]*\} from "@stackra\/scope\/node";/);
    expect(content).not.toContain("ScopeTreeReader");
  });

  it("registers event names, jobs and outbound webhooks by their locked identities", () => {
    expect(billing).toContain(
      'registerEventNames([\n  { type: InvoiceIssued, name: "billing.invoice.issued.v2" },\n]);',
    );
    const job = '  { type: SendRemindersAction, key: "billing.invoice.send_reminders@1" },';
    expect(billing).toContain(`registerJobs([\n${job}\n]);`);
    expect(billing).toContain(`registerScheduledJobs([\n${job}\n]);`);
    expect(billing).toContain(
      'registerOutboundWebhooks([\n  { type: InvoiceIssued, name: "billing.invoice.issued.v2" },\n]);',
    );
    expect(billing).toContain('import { registerOutboundWebhooks } from "@stackra/webhooks/node";');
    // Event names register through @stackra/events, below @stackra/actions, so a package below the outbox needs no
    // outbox dependency (STA-1387).
    expect(billing).toMatch(/import \{[^}]*registerEventNames[^}]*\} from "@stackra\/events";/);
    expect(billing).not.toContain("@stackra/outbox");
  });

  it("neither registers nor imports an integration that has no connection (STA-1803)", () => {
    const paypal: DeclaredClass = {
      name: "PaypalIntegration",
      kind: "integration",
      module: "billing",
      file: "src/modules/billing/integrations/paypal.integration.ts",
      importPath: "#modules/billing/integrations/paypal.integration",
      options: {},
      deps: [],
      facets: [],
      methods: [],
      refusals: [],
      statics: {},
      traits: [],
    };
    const content =
      registrationsOf({ ...BILLING_IR, classes: [...BILLING_IR.classes, paypal] }) ?? "";
    expect(content).toContain("integration: StripeIntegration");
    expect(content).not.toContain("PaypalIntegration");
  });

  it("registers the connections of the connector packages it declares, imported from each package", () => {
    const hosting = registrationsOf({
      ...BILLING_IR,
      dependencies: [...BILLING_IR.dependencies, ...CONNECTOR_PACKAGES],
    });
    expect(hosting).toContain(
      '{ connection: WalletConnection, integration: WalletIntegration, key: "connector_wallet.wallet" },',
    );
    expect(hosting).toContain(
      '{ connection: PaylinkConnection, integration: PaylinkIntegration, key: "connector_paylink.paylink" },',
    );
    expect(hosting).toMatch(
      /import \{[^}]*WalletConnection[^}]*WalletIntegration[^}]*\} from "@figentra\/connector-wallet\/node";/,
    );
    expect(hosting).toMatch(/\} from "@figentra\/connector-paylink\/node";/);
  });

  it("registers connections, webhook events, sequences and searchable models", () => {
    expect(billing).toContain(
      'registerConnections([\n  { connection: StripeConnection, integration: StripeIntegration, key: "billing.stripe" },\n]);',
    );
    expect(billing).toContain(
      "registerWebhookEvents([\n  { event: StripePaymentSucceeded, integration: StripeIntegration, connection: StripeConnection },\n]);",
    );
    expect(billing).toContain(
      [
        "registerSequences([",
        '  { type: InvoiceSequence, key: "billing.invoice" },',
        '  { type: SegmentExportSequence, key: "segments.export" },',
        "]);",
      ].join("\n"),
    );
    expect(billing).toMatch(
      /import \{[^}]*SegmentExportSequence[^}]*\} from "@stackra\/segments\/node";/,
    );
    expect(billing).toContain("registerSearchableModels([\n  Invoice,\n]);");
    expect(billing).toContain(
      'import { registerEntities, registerModelPartners, registerSequences } from "@stackra/database";',
    );
  });

  it("registers each report with its source model", () => {
    const invoice = BILLING_IR.classes.find((declared) => declared.name === "Invoice");
    if (invoice === undefined) throw new Error("the fixture has no Invoice");
    const report: DeclaredClass = {
      ...invoice,
      name: "InvoiceTotalsReport",
      kind: "report",
      facets: [],
      options: { key: "invoice_totals" },
      file: "src/modules/billing/reports/invoice-totals.report.ts",
      importPath: "#modules/billing/reports/invoice-totals.report",
      partner: { name: "Invoice", from: invoice.importPath },
    };
    const text = registrationsOf({ ...BILLING_IR, classes: [...BILLING_IR.classes, report] }) ?? "";
    expect(text).toContain("registerReportSources([\n  [InvoiceTotalsReport, Invoice],\n]);");
    expect(text).toContain('import { registerReportSources } from "@stackra/reports/node";');
    expect(billing).not.toContain("registerReportSources");
  });

  it("refuses to import `unknown`: a webhook event whose partner resolved to no class stops the run (SHIP, 0.29)", () => {
    const unresolved: DeclaredClass = {
      name: "QuiqupOrderUpdated",
      kind: "webhook_event",
      module: "orders",
      file: "src/modules/orders/events/quiqup-order-updated.event.ts",
      importPath: "#modules/orders/events/quiqup-order-updated.event",
      options: { type: "order" },
      partner: { name: "unknown", from: "@figentra/ship-connector-quiqup/node" },
      deps: [],
      facets: [],
      methods: [],
      refusals: [],
      statics: {},
      traits: [],
    };
    expect(() =>
      registrationsOf({ ...COMMERCE_IR, classes: [...COMMERCE_IR.classes, unresolved] }),
    ).toThrow("gen would import `unknown` from @figentra/ship-connector-quiqup/node");
  });

  it("writes no file for an app or a member with nothing to register", () => {
    expect(registrationsOf(WEB_APP_IR)).toBeUndefined();
    expect(registrationsOf({ ...COMMERCE_IR, classes: [], shapes: [], enums: [] })).toBeUndefined();
  });
});

/** A listener class of the storefront module with the given `handle`. */
function listener(name: string, handle: DeclaredClass["handle"]): DeclaredClass {
  return {
    name,
    kind: "listener",
    module: "storefront",
    file: `src/modules/storefront/listeners/${name}.ts`,
    importPath: `#modules/storefront/listeners/${name}`,
    options: {},
    deps: [],
    facets: [],
    methods: ["handle"],
    ...(handle !== undefined ? { handle } : {}),
    refusals: [],
    statics: {},
    traits: [],
  };
}

describe("emitRegistrations for listeners", () => {
  const ir: MemberIR = {
    member: "channels",
    package: "@acme/service-channels",
    version: "0.1.0",
    layout: "service",
    modules: ["storefront"],
    classes: [
      listener("SyncOnOrderPaidListener", {
        event: { name: "OrderPaid", from: "#stackra/clients/commerce" },
      }),
      listener("AuditOnOrderPaidListener", {
        event: { name: "OrderPaid", from: "#stackra/clients/commerce" },
      }),
      listener("WebhooksRelayListener", { relay: true }),
    ],
    shapes: [],
    enums: [],
    files: [],
    dependencies: [],
    errors: [],
    services: [{ member: "commerce", manifest: buildManifest(COMMERCE_IR).manifest }],
  };
  const content = registrationsOf(ir) ?? "";

  it("registers a consumed event's wire name once, from the producer's manifest", () => {
    expect(content).toContain(
      'registerEventNames([\n  { type: OrderPaid, name: "orders.order.paid.v1" },\n]);',
    );
    expect(content).toContain('import { OrderPaid } from "#stackra/clients/commerce";');
    expect(content).not.toMatch(/import \{[^}]*registerEventNames[^}]*\} from "@stackra\/outbox";/);
  });

  it("registers each listener with the event class it imports", () => {
    expect(content).toContain(
      [
        "registerListeners([",
        "  [OrderPaid, SyncOnOrderPaidListener],",
        "  [OrderPaid, AuditOnOrderPaidListener],",
        "]);",
      ].join("\n"),
    );
    expect(content).toContain(
      'import { registerEventNames, registerListeners } from "@stackra/events";',
    );
  });

  it("registers a relay listener, which takes every envelope", () => {
    expect(content).toContain("registerRelays([\n  WebhooksRelayListener,\n]);");
    expect(content).toMatch(/import \{[^}]*registerRelays[^}]*\} from "@stackra\/outbox";/);
  });
});

describe("emitRegistrations for entitlements", () => {
  const create: DeclaredClass = {
    name: "CreateOrderAction",
    kind: "action",
    module: "orders",
    file: "src/modules/orders/actions/create-order.action.ts",
    importPath: "#modules/orders/actions/create-order.action",
    options: { key: "order.create", actors: ["user"] },
    deps: [],
    facets: [],
    methods: ["handle"],
    refusals: [],
    statics: {},
    traits: [],
  };
  const limit: DeclaredClass = {
    ...create,
    name: "OrderLimitEntitlement",
    kind: "entitlement",
    file: "src/modules/orders/access/order-limit.entitlement.ts",
    importPath: "#modules/orders/access/order-limit.entitlement",
    options: {
      kind: "limit",
      counts: { $class: "Order", from: "#modules/orders/models/order.model", kind: "model" },
    },
    methods: [],
  };
  const content =
    registrationsOf({ ...COMMERCE_IR, classes: [...COMMERCE_IR.classes, create, limit] }) ?? "";

  it("registers each entitlement with its locked key and the create its limit gates (STA-903)", () => {
    expect(content).toContain(
      [
        "registerEntitlements([",
        '  { type: OrderLimitEntitlement, key: "orders.order_limit", gates: [CreateOrderAction] },',
        "]);",
      ].join("\n"),
    );
    expect(content).toContain('import { registerEntitlements } from "@stackra/entitlements";');
  });
});

describe("emitRegistrations for cached queries (STA-1445)", () => {
  const query = COMMERCE_IR.classes.find((declared) => declared.kind === "query") as DeclaredClass;
  const orderPaid = {
    $class: "OrderPaid",
    from: "#modules/orders/events/order-paid.event",
    kind: "integration_event",
  };
  /** The commerce registrations with its query's `cache` option set to `cache`. */
  const withCache = (cache: object): string =>
    registrationsOf({
      ...COMMERCE_IR,
      classes: COMMERCE_IR.classes.map((declared) =>
        declared === query ? { ...declared, options: { ...declared.options, cache } } : declared,
      ),
    }) ?? "";

  it("registers a query whose cache names invalidating events", () => {
    const content = withCache({ ttl: "5m", invalidateOn: [orderPaid] });
    expect(content).toContain(`registerCachedQueries([\n  ${query.name},\n]);`);
    expect(content).toContain('registerCachedQueries } from "@stackra/actions";');
  });

  it("leaves out a query cached by time only", () => {
    expect(withCache({ ttl: "5m" })).not.toContain("registerCachedQueries");
  });
});

/** A service of the orders module carrying a `@ConsumesChanges` facet with `options`. */
function consumer(name: string, options: unknown): DeclaredClass {
  return {
    name,
    kind: "service",
    module: "orders",
    file: `src/modules/orders/services/${name}.ts`,
    importPath: `#modules/orders/services/${name}`,
    options: {},
    deps: [],
    facets: [
      {
        name: "ConsumesChanges",
        kind: "consumes_changes",
        target: "class",
        options,
        from: "@stackra/outbox",
      },
    ],
    methods: ["consume"],
    refusals: [],
    statics: {},
    traits: [],
  };
}

describe("emitRegistrations for change consumers (data-layer gap cdc2)", () => {
  const product = {
    $class: "Product",
    from: "#modules/orders/models/product.model",
    kind: "model",
  };
  const variant = { $class: "Variant", from: "@acme/catalogue-kit", kind: "model" };
  const content =
    registrationsOf({
      ...COMMERCE_IR,
      classes: [
        ...COMMERCE_IR.classes,
        consumer("ProductFeedService", product),
        consumer("CatalogueFeedService", [product, variant]),
      ],
    }) ?? "";

  it("pairs each watched model with its @ConsumesChanges service", () => {
    expect(content).toContain(
      [
        "registerChangeConsumers([",
        "  [Product, ProductFeedService],",
        "  [Product, CatalogueFeedService],",
        "  [Variant, CatalogueFeedService],",
        "]);",
      ].join("\n"),
    );
    expect(content).toMatch(
      /import \{[^}]*registerChangeConsumers[^}]*\} from "@stackra\/outbox";/,
    );
    expect(content).toContain('import { Variant } from "@acme/catalogue-kit";');
  });
});

/** A class of the orders module's access group. */
function access(
  name: string,
  kind: DeclaredClass["kind"],
  file: string,
  statics: DeclaredClass["statics"] = {},
): DeclaredClass {
  return {
    name,
    kind,
    module: "orders",
    file: `src/modules/orders/access/${file}.ts`,
    importPath: `#modules/orders/access/${file}`,
    options: {},
    deps: [],
    facets: [],
    methods: [],
    refusals: [],
    statics,
    traits: [],
  };
}

describe("emitRegistrations for permissions and roles (STA-1702)", () => {
  const content =
    registrationsOf({
      ...COMMERCE_IR,
      classes: [
        ...COMMERCE_IR.classes,
        access("RefundPermissions", "permissions", "refund.permissions", {
          approve: "Permission.L3.restricted()",
          expire: "Permission.L2 .system()",
          label: '"refunds"',
        }),
        access("OrderClerkRole", "role", "order-clerk.role"),
      ],
    }) ?? "";

  it("registers every Permission static by its locked key, system and restricted ones included", () => {
    expect(content).toContain(
      [
        "registerPermissions([",
        '  { type: OrderPermissions, keys: { read: "orders.order.read", create: "orders.order.create", cancel: "orders.order.cancel" } },',
        '  { type: RefundPermissions, keys: { approve: "orders.refund.approve", expire: "orders.refund.expire" } },',
        "]);",
      ].join("\n"),
    );
    expect(content).toMatch(/import \{[^}]*registerPermissions[^}]*\} from "@stackra\/container";/);
    expect(content).toMatch(/import \{[^}]*registerRoles[^}]*\} from "@stackra\/iam";/);
  });

  it("imports nothing from @stackra/iam for a member that declares permissions but no roles (ADR 0513)", () => {
    const withoutRoles = registrationsOf(COMMERCE_IR) ?? "";
    expect(withoutRoles).toContain("registerPermissions([");
    expect(withoutRoles).not.toContain("@stackra/iam");
  });

  it("registers each module role by its derived key, after the permissions its grants name", () => {
    expect(content).toContain(
      'registerRoles([\n  { type: OrderClerkRole, key: "orders.order_clerk" },\n]);',
    );
    expect(content.indexOf("registerRoles([")).toBeGreaterThan(
      content.indexOf("registerPermissions(["),
    );
  });
});

describe("emitRegistrations for a hosted package's permissions and roles (STA-1710)", () => {
  const content =
    registrationsOf({
      ...COMMERCE_IR,
      dependencies: [
        {
          package: "@acme/records-kit",
          manifest: {
            member: "records_kit",
            package: "@acme/records-kit",
            version: "0.1.0",
            permissions: [
              {
                key: "records_kit.record.purge",
                risk: "L2",
                class: "RecordPermissions",
                module: "records_kit",
                member: "purge",
                file: "src/node/access/record.permissions.ts",
                system: true,
              },
              {
                key: "records_kit.record.read_medical",
                risk: "L3",
                class: "RecordPermissions",
                module: "records_kit",
                member: "readMedical",
                file: "src/node/access/record.permissions.ts",
              },
              // a manifest written before STA-1710: no member or file, the verb from the key
              { key: "legacy_kit.note.read", risk: "L0", class: "NotePermissions" },
            ],
            roles: [
              {
                key: "records_kit.nurse",
                class: "NurseRole",
                module: "records_kit",
                file: "src/node/access/nurse.role.ts",
              },
            ],
          },
        },
      ],
    }) ?? "";

  it("registers each hosted permission set by its entry, keyed by its statics", () => {
    expect(content).toContain(
      '  { type: RecordPermissions, keys: { purge: "records_kit.record.purge", readMedical: "records_kit.record.read_medical" } },',
    );
    expect(content).toMatch(
      /import \{[^}]*RecordPermissions[^}]*\} from "@acme\/records-kit\/node";/,
    );
    expect(content).toContain(
      '  { type: NotePermissions, keys: { read: "legacy_kit.note.read" } },',
    );
  });

  it("registers each hosted module role after every permission", () => {
    expect(content).toContain('  { type: NurseRole, key: "records_kit.nurse" },');
    expect(content).toMatch(/import \{[^}]*NurseRole[^}]*\} from "@acme\/records-kit\/node";/);
    expect(content.indexOf("registerRoles([")).toBeGreaterThan(
      content.indexOf("registerPermissions(["),
    );
  });
});

describe("emitRegistrations of actions and queries (STA-2025)", () => {
  /** A query anonymous callers may call, beside the commerce fixture's calls. */
  const health: DeclaredClass = {
    name: "CheckHealthQuery",
    kind: "query",
    module: "orders",
    file: "src/modules/orders/queries/check-health.query.ts",
    importPath: "#modules/orders/queries/check-health.query",
    options: { key: "health.check", actors: ["anonymous", "user"] },
    deps: [],
    facets: [],
    methods: ["handle"],
    refusals: [],
    statics: {},
    traits: [],
  };
  const ir: MemberIR = { ...COMMERCE_IR, classes: [...COMMERCE_IR.classes, health] };
  const manifest = buildManifest(ir).manifest;
  const content = emitRegistrations(ir, manifest) ?? "";
  const rows = content
    .split("\n")
    .filter((line) => line.startsWith("  { type: ") && line.includes(" risk: "));

  it("registers every action and query with its locked key, permission, risk and input and output classes", () => {
    expect(content).toMatch(/import \{[^}]*registerActions[^}]*\} from "@stackra\/actions";/);
    expect(content).toContain(
      '  { type: CancelOrderAction, key: "orders.order.cancel@1", permission: "orders.order.cancel", risk: "L2"',
    );
    expect(content).toMatch(
      /\{ type: CancelOrderAction, [^}]*input: CancelOrderInput, output: CancelOrderOutput \}/,
    );
    expect(content).toContain('{ type: ListOrdersQuery, key: "orders.order.list@1"');
    expect(rows).toHaveLength(manifest.actions?.length ?? -1);
  });

  it("registers an anonymous-callable query with its permission, and flags it in the manifest", () => {
    expect(rows.find((line) => line.includes("type: CheckHealthQuery"))).toBe(
      '  { type: CheckHealthQuery, key: "orders.health.check@1", permission: "orders.health.read", risk: "L0" },',
    );
    const entries = manifest.actions ?? [];
    expect(
      entries.filter((entry) => entry["anonymous"] === true).map((entry) => entry.key),
    ).toEqual(["orders.health.check@1"]);
  });
});

describe("emitRegistrations of record policies (STA-2045)", () => {
  /** The order policy, typed against the commerce fixture's model. */
  const orderPolicy: DeclaredClass = {
    name: "OrderPolicy",
    kind: "policy",
    module: "orders",
    file: "src/modules/orders/access/order.policy.ts",
    importPath: "#modules/orders/access/order.policy",
    options: {},
    partner: { name: "Order", from: "#modules/orders/models/order.model" },
    deps: [],
    facets: [],
    methods: ["read", "cancel"],
    refusals: [],
    statics: {},
    traits: [],
  };
  const ir: MemberIR = {
    ...COMMERCE_IR,
    classes: [...COMMERCE_IR.classes, orderPolicy],
    dependencies: [
      {
        package: "@acme/loyalty-kit",
        manifest: {
          member: "loyalty_kit",
          package: "@acme/loyalty-kit",
          version: "0.1.0",
          policies: [
            {
              class: "LoyaltyAccountPolicy",
              model: "LoyaltyAccount",
              module: "loyalty_kit",
              file: "src/node/access/loyalty-account.policy.ts",
              modelFile: "src/node/models/loyalty-account.model.ts",
            },
            // a policy whose model the package does not declare: no file to import it from
            {
              class: "ForeignPolicy",
              model: "Foreign",
              module: "loyalty_kit",
              file: "src/node/access/foreign.policy.ts",
            },
          ],
        },
      },
    ],
  };
  const manifest = buildManifest(ir).manifest;
  const content = emitRegistrations(ir, manifest) ?? "";

  it("records each policy with its model, own then hosted", () => {
    expect(manifest["policies"]).toEqual([
      expect.objectContaining({
        class: "OrderPolicy",
        model: "Order",
        module: "orders",
        file: "src/modules/orders/access/order.policy.ts",
      }),
      expect.objectContaining({ class: "LoyaltyAccountPolicy", from: "@acme/loyalty-kit" }),
      expect.objectContaining({ class: "ForeignPolicy", from: "@acme/loyalty-kit" }),
    ]);
  });

  it("registers each policy with the model it judges, a hosted one imported from its package", () => {
    expect(content).toMatch(/import \{[^}]*registerPolicies[^}]*\} from "@stackra\/iam";/);
    expect(content).toContain("  { model: Order, policy: OrderPolicy },");
    expect(content).toContain("  { model: LoyaltyAccount, policy: LoyaltyAccountPolicy },");
    expect(content).toMatch(
      /import \{[^}]*LoyaltyAccountPolicy[^}]*\} from "@acme\/loyalty-kit\/node";/,
    );
    expect(content).not.toContain("ForeignPolicy");
  });

  it("records no policies section and registers none for a member without a policy", () => {
    expect(buildManifest(COMMERCE_IR).manifest["policies"]).toBeUndefined();
    expect(registrationsOf(COMMERCE_IR) ?? "").not.toContain("registerPolicies");
  });
});

describe("emitRegistrations for extensions", () => {
  /** A slot runs only the extensions registered on it; gen read the point and slot from the type argument. */
  it("registers each extension on its point's slot with its order", () => {
    const content =
      registrationsOf({ ...COMMERCE_IR, classes: [...COMMERCE_IR.classes, EXTENSION] }) ?? "";
    expect(content).toMatch(/import \{[^}]*registerExtensions[^}]*\} from "@stackra\/actions";/);
    expect(content).toContain(
      '  { point: OrderExtensionPoint, slot: "adjustTotals", extension: TierBonusExtension, order: 200 },',
    );
    expect(registrationsOf(COMMERCE_IR) ?? "").not.toContain("registerExtensions");
  });
});

/** The courier carrier package's manifest, as gen writes it for the package. */
const COURIER = buildManifest(COURIER_PACKAGE_IR).manifest;

/** The billing service hosting the courier package by `manifest`, with `classes` added to its own. */
function hostingCourier(
  manifest: MemberIR["dependencies"][number]["manifest"],
  classes: readonly DeclaredClass[] = [],
): MemberIR {
  return {
    ...BILLING_IR,
    classes: [...BILLING_IR.classes, ...classes],
    dependencies: [...BILLING_IR.dependencies, { package: "@acme/ship-courier", manifest }],
  };
}

/** A billing class typed against the courier package's classes, imported from its `./node` entry. */
function billingClass(name: string, kind: string, more: Partial<DeclaredClass>): DeclaredClass {
  return {
    name,
    kind,
    module: "billing",
    file: `src/modules/billing/${kind === "listener" ? "listeners" : "events"}/${name}.ts`,
    importPath: `#modules/billing/${kind === "listener" ? "listeners" : "events"}/${name}`,
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

/** A hosted package's `WebhookEvent<I>` classes, registered from its manifest with their Connection. */
describe("emitRegistrations for a hosted package's webhook events", () => {
  /** The package ships the event; the service names no carrier class, yet the receiver routes it. */
  it("registers a hosted event with its Integration and Connection, imported from the package entry", () => {
    const content = registrationsOf(hostingCourier(COURIER)) ?? "";
    expect(content).toContain(
      [
        "registerWebhookEvents([",
        "  { event: StripePaymentSucceeded, integration: StripeIntegration, connection: StripeConnection },",
        "  { event: CourierShipmentUpdated, integration: CourierIntegration, connection: CourierConnection },",
        "]);",
      ].join("\n"),
    );
    for (const name of ["CourierShipmentUpdated", "CourierIntegration", "CourierConnection"])
      expect(content).toMatch(
        new RegExp(`import \\{[^}]*\\b${name}\\b[^}]*\\} from "@acme/ship-courier/node";`),
      );
    expect(content).not.toMatch(/ImportedCourier/);
  });

  /**
   * An own event typed against a hosted Integration used to register with no `connection`, so the receiver answered
   * 404 for `/webhooks/<module>/<integration>/:connectionId`; it now carries the Connection the package's manifest
   * lists, even from a manifest written before `webhookEvents`.
   */
  it("pairs an own event typed against a hosted Integration with that Integration's hosted Connection", () => {
    const older = Object.fromEntries(
      Object.entries(COURIER).filter(([key]) => key !== "webhookEvents"),
    ) as typeof COURIER;
    const own = billingClass("ParcelLost", "webhook_event", {
      options: { type: "parcel.lost" },
      partner: { name: "CourierIntegration", kind: "integration", from: "@acme/ship-courier/node" },
    });
    const ir = hostingCourier(older, [own]);
    const content = registrationsOf(ir) ?? "";
    expect(content).toContain(
      "  { event: ParcelLost, integration: CourierIntegration, connection: CourierConnection },",
    );
    expect(content).not.toContain("CourierShipmentUpdated");
    expect(emitWebhooks(ir)).toContain('  "ship-courier/courier": CourierIntegration,');
    expect(emitWebhooks(ir)).toMatch(
      /import \{[^}]*\bCourierIntegration\b[^}]*\} from "@acme\/ship-courier\/node";/,
    );
  });

  /** Listeners stay in the service: one typed with the hosted event is wired like one typed with its own. */
  it("wires a service listener typed with a hosted event, sharing the event's import", () => {
    const listening = billingClass("NotifyOnShipmentUpdatedListener", "listener", {
      methods: ["handle"],
      handle: { event: { name: "CourierShipmentUpdated", from: "@acme/ship-courier/node" } },
    });
    const content = registrationsOf(hostingCourier(COURIER, [listening])) ?? "";
    expect(content).toContain(
      "registerListeners([\n  [CourierShipmentUpdated, NotifyOnShipmentUpdatedListener],\n]);",
    );
    expect(content).not.toMatch(/ImportedCourierShipmentUpdated/);
  });

  /** A host with no hosted webhook event writes exactly what it wrote before, and its manifest gains no section. */
  it("leaves a host without hosted webhook events unchanged", () => {
    const older = Object.fromEntries(
      Object.entries(COURIER).filter(([key]) => key !== "webhookEvents"),
    ) as typeof COURIER;
    const before = registrationsOf(hostingCourier(older));
    expect(before).not.toContain("CourierShipmentUpdated");
    expect(registrationsOf(hostingCourier({ ...older, webhookEvents: [] }))).toBe(before);
    expect(registrationsOf(BILLING_IR)).toContain(
      "registerWebhookEvents([\n  { event: StripePaymentSucceeded, integration: StripeIntegration, connection: StripeConnection },\n]);",
    );
    expect(buildManifest(hostingCourier(COURIER)).manifest).not.toHaveProperty("webhookEvents");
    expect(buildManifest(BILLING_IR).manifest).not.toHaveProperty("webhookEvents");
  });
});
