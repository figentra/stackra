/**
 * Stackra file contract:
 * Purpose: unit tests of `emitRegistrations`: the generated entity and schemas files loaded first, then one call per
 *          platform registration with a row each, from the locked identities: the hosted packages' entity lists, the
 *          model partners of each `CrudService<M>` (and of an injected platform one, `RuleSetService`), event wire names, jobs for the queue and the scheduler,
 *          connections, webhook events, outbound webhooks, sequences (a hosted package's imported from its entry),
 *          entitlements with the calls they gate (STA-903) and searchable models; a listener with the event class it imports (its own, or a consumed service's, whose wire
 *          name comes from the producer's manifest) and a relay listener; no file for an app or a member with nothing
 *          to register.
 * Boundary: test only; runs on the IR fixtures and the manifests `buildManifest` derives from them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 20 and 22); ADR 0097; ADR 0141; ADR 0308;
 *                     ADR 0342; ADR 0260 (decision 4); STA-1387 (event names from @stackra/events).
 */
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { emitRegistrations } from "#core/functions/emit-registrations.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

/** The registrations of `ir` against its own derived manifest. */
function registrationsOf(ir: MemberIR): string | undefined {
  return emitRegistrations(ir, buildManifest(ir).manifest);
}

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

  it("registers the model partner of a platform CrudService a class injects", () => {
    const rules: DeclaredClass = {
      name: "DunningRulesService",
      kind: "service",
      module: "billing",
      file: "src/modules/billing/services/dunning-rules.service.ts",
      importPath: "#modules/billing/services/dunning-rules.service",
      options: {},
      deps: [{ class: { name: "RuleSetService", from: "@stackra/rules/node" } }],
      facets: [],
      methods: [],
      refusals: [],
      statics: {},
      traits: [],
    };
    const content =
      registrationsOf({ ...BILLING_IR, classes: [...BILLING_IR.classes, rules] }) ?? "";
    expect(content).toContain(
      "registerModelPartners([\n  [InvoiceService, Invoice],\n  [RuleSetService, RuleSet],\n]);",
    );
    expect(content).toMatch(/import \{[^}]*RuleSet[^}]*\} from "@stackra\/rules\/node";/);
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
