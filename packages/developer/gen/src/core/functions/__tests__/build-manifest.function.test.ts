/**
 * Stackra file contract:
 * Purpose: unit tests of `buildManifest`: every derived identity (permissions with risks, event wire names with their
 *          broadcast, refusal codes with categories, action and query keys with endpoints, tools and refusals, model
 *          keys and tables, driver port keys and selectors, integration keys with their connection and webhook path,
 *          sequence keys, an app's block and route keys), the module graph, the facets, the schemas without a config's
 *          schema, merged package sections marked `from`, and the checks `identity_collision`, `override_duplicate`,
 *          `permission_unknown`, `identity_missing`, `prefix_invalid`, `prefix_taken` and `prefix_duplicate`;
 *          `event_name_prefixed` (STA-1255); the v3 tool default (L3 and L4 actions off) with `tool_reason_missing`,
 *          an action's `dataClass` with `data_class_unknown` (STA-2594), the public flag with
 *          `public_without_endpoint`, effect tags with `effect_unknown`, `endpoint_param_unbound`
 *          (STA-2063),
 *          Integration roles and listing with `integration_role_unknown`, `webhook_event_id_undeclared` (webhooks
 *          that name no event id outside Standard Webhooks), the `@Replaces` section, and a replica
 *          query's `ReplicaPage` output schema (ADR 0338); a package's drivers with each candidate's class, entry and
 *          tokens and the selecting config class (STA-1297); a package's `config` section (STA-1308); the `agents`,
 *          `passes` and `entitlements` sections with derived entitlement keys and gates (STA-903).
 * Boundary: test only; runs on the commerce IR fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 10, 20, 21 and 22); ADR 0305 (rules 1, 28 and
 *                     34); ADR 0140; ADR 0141; ADR 0135 (rule 2); ADR 0308 (rules 19 and 21); ADR 0342 (decision 1);
 *                     ADR 0360 (decisions 4 and 10); ADR 0099 (decisions 2 and 3); ADR 0355 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { MANIFEST_NOTICE } from "#core/constants/manifest-notice.constant";
import { buildManifest } from "#core/functions/build-manifest.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { TypeDesc } from "#core/types/type-desc.type";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { COURIER_PACKAGE_IR } from "#core/__tests__/fixtures/courier-package-ir.fixture";
import { INBOX_IR, PRODUCER_IR } from "#core/__tests__/fixtures/cross-app-ir.fixture";
import {
  CONNECTOR_PACKAGES,
  connectorPackage,
} from "#core/__tests__/fixtures/connector-packages.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

/** The fixture class named `name`. */
function declared(name: string): DeclaredClass {
  const found = COMMERCE_IR.classes.find((candidate) => candidate.name === name);
  if (found === undefined) throw new Error(`no fixture class ${name}`);
  return found;
}

/** A class of `kind` at `file`, shaped like the fixture's CancelOrderAction. */
function kindClass(
  name: string,
  kind: string,
  file: string,
  options: Record<string, unknown>,
): DeclaredClass {
  return {
    ...declared("CancelOrderAction"),
    name,
    kind,
    file,
    importPath: `#${file}`,
    options,
    deps: [],
  };
}

/** The billing service with its Stripe Integration receiving `webhooks` and nothing else. */
function receiving(webhooks: Record<string, unknown>): MemberIR {
  return {
    ...BILLING_IR,
    classes: BILLING_IR.classes.map((candidate) =>
      candidate.name === "StripeIntegration" ? { ...candidate, options: { webhooks } } : candidate,
    ),
  };
}

/** The billing service with its Stripe Integration calling `baseUrl`. */
function withBase(baseUrl: string): MemberIR {
  return {
    ...BILLING_IR,
    classes: BILLING_IR.classes.map((candidate) =>
      candidate.name === "StripeIntegration"
        ? { ...candidate, options: { ...candidate.options, baseUrl } }
        : candidate,
    ),
  };
}

/** The billing service with one Stripe Integration per written key, the second and later renamed. */
function keyed(...keys: unknown[]): MemberIR {
  return {
    ...BILLING_IR,
    classes: BILLING_IR.classes.flatMap((candidate) =>
      candidate.name === "StripeIntegration"
        ? keys.map((key, index) => ({
            ...candidate,
            name: index === 0 ? candidate.name : `Stripe${index}Integration`,
            options: { ...candidate.options, key },
          }))
        : [candidate],
    ),
  };
}

/** BILLING_IR with its Invoice numbered by `sequence`. */
const billingNumberedBy = (sequence: string): MemberIR => ({
  ...BILLING_IR,
  classes: BILLING_IR.classes.map((candidate) =>
    candidate.name === "Invoice"
      ? {
          ...candidate,
          facets: [
            ...candidate.facets,
            {
              name: "DocumentNumber",
              kind: "document_number",
              target: "field" as const,
              member: "number",
              options: { sequence },
              from: "@stackra/model",
            },
          ],
        }
      : candidate,
  ),
});

/** The manifest entry of `CancelOrderAction` in `ir`. */
const cancelEntryOf = (ir: MemberIR) =>
  buildManifest(ir).manifest.actions?.find((action) => action.class === "CancelOrderAction");

/** `code subject` of each error the manifest build reports for `ir`. */
const codesOf = (ir: MemberIR): string[] =>
  buildManifest(ir).errors.map((error) => `${error.code} ${error.subject}`);

/** The commerce member in the `admin` area, with `options` added to CancelOrderAction's. */
const withCancelOptions = (options: Record<string, unknown>): MemberIR => ({
  ...COMMERCE_IR,
  area: "admin",
  classes: COMMERCE_IR.classes.map((cls) =>
    cls.name === "CancelOrderAction" ? { ...cls, options: { ...cls.options, ...options } } : cls,
  ),
});

/** CancelOrderAction's manifest entry when `options` are added to it. */
const cancelOf = (options: Record<string, unknown>) =>
  buildManifest(withCancelOptions(options)).manifest.actions?.find(
    (action) => action.class === "CancelOrderAction",
  );

describe("buildManifest", () => {
  const { manifest, errors } = buildManifest(COMMERCE_IR);

  it("derives the header, permissions and events", () => {
    expect(errors).toEqual([]);
    expect(manifest.$comment).toBe(MANIFEST_NOTICE);
    expect(manifest.member).toBe("commerce");
    expect(manifest.permissions).toEqual([
      {
        key: "orders.order.read",
        risk: "L0",
        class: "OrderPermissions",
        module: "orders",
        member: "read",
        file: "src/modules/orders/access/order.permissions.ts",
      },
      {
        key: "orders.order.create",
        risk: "L2",
        class: "OrderPermissions",
        module: "orders",
        member: "create",
        file: "src/modules/orders/access/order.permissions.ts",
      },
      {
        key: "orders.order.cancel",
        risk: "L2",
        class: "OrderPermissions",
        module: "orders",
        member: "cancel",
        file: "src/modules/orders/access/order.permissions.ts",
      },
    ]);
    expect(manifest["roles"]).toEqual([]);
    expect(manifest.events).toEqual([
      {
        name: "orders.order.paid.v1",
        module: "orders",
        class: "OrderPaid",
        file: "src/modules/orders/events/order-paid.event.ts",
        kind: "integration",
        version: 1,
        broadcast: { permission: "orders.order.read", audience: "tenant" },
        fields: { $ref: "#/schemas/orders.OrderPaid" },
      },
    ]);
  });

  it("derives refusals, actions and queries", () => {
    expect(manifest.errors).toEqual([
      {
        code: "order_not_cancellable",
        kind: "failed_precondition",
        category: "precondition_failed",
        module: "orders",
        class: "OrderNotCancellableError",
      },
    ]);
    const [cancel, list] = manifest.actions ?? [];
    expect(cancel).toMatchObject({
      key: "orders.order.cancel@1",
      kind: "action",
      permission: "orders.order.cancel",
      risk: "L2",
      actors: ["user", "agent"],
      idempotency: "required",
      endpoint: { method: "PUT", path: "/app/orders/:orderId/cancel", derived: true },
      input: { $ref: "#/schemas/orders.CancelOrderInput" },
      output: { $ref: "#/schemas/orders.CancelOrderOutput" },
      refusals: ["order_not_cancellable"],
    });
    // ADR 0360 d4: an action a user can perform is a tool by default.
    expect(cancel?.["tool"]).toEqual({
      name: "orders_order_cancel",
      default: true,
      hints: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    });
    expect(list).toMatchObject({
      key: "orders.order.list@1",
      permission: "orders.order.read",
      risk: "L0",
      endpoint: { method: "GET", path: "/app/orders" },
      tool: { name: "orders_order_list", default: true },
    });
  });

  it("takes a service's `defineService({ area })` for an action with no area; a package keeps `app` (STA-340)", () => {
    const cancel = buildManifest({ ...COMMERCE_IR, area: "admin" }).manifest.actions?.[0];
    expect(cancel).toMatchObject({
      key: "orders.order.cancel@1",
      area: "admin",
      endpoint: { method: "PUT", path: "/admin/orders/:orderId/cancel" },
    });
    const redeem = buildManifest({ ...LOYALTY_KIT_IR, area: "admin" }).manifest.actions?.find(
      (action) => action.class === "RedeemPointsAction",
    );
    expect(redeem?.["area"]).toBe("app");
    expect(redeem?.["endpoint"]).toMatchObject({ path: expect.stringMatching(/^\/app\//) });
  });

  it("puts an anonymous-only call in the public area unless it writes one (STA-2650)", () => {
    expect(cancelOf({ actors: ["anonymous"] })).toMatchObject({
      area: "public",
      endpoint: { path: "/public/orders/:orderId/cancel" },
    });
    expect(cancelOf({ actors: ["anonymous"], area: "app" })).toMatchObject({ area: "app" });
    expect(cancelOf({ actors: ["user", "anonymous"] })).toMatchObject({ area: "admin" });
  });

  it("derives models, drivers, modules and facets", () => {
    expect(manifest.models).toEqual([
      {
        key: "orders.order",
        class: "Order",
        file: "src/modules/orders/models/order.model.ts",
        table: "orders.orders",
        publicId: "ord",
        traits: ["HasPublicId", "Timestamps"],
      },
    ]);
    expect(manifest.drivers).toEqual([
      {
        port: "PaymentGateway",
        key: "commerce.PaymentGateway",
        candidates: ["stripe"],
        selectedBy: "config:commerce.gateway",
      },
    ]);
    expect(manifest.modules).toEqual([
      { key: "commerce", class: "CommerceModule", exports: [], dependsOn: [] },
      { key: "orders", exports: [], dependsOn: ["commerce"] },
    ]);
    expect(manifest["facets"]).toEqual([
      {
        name: "Audited",
        kind: "audited",
        target: "class",
        from: "#modules/orders/functions/audited.function",
        targets: ["OrderService.cancel", "OrderService.list"],
      },
    ]);
  });

  it("records wire schemas and never a config's schema", () => {
    const schemas = manifest.schemas as Record<string, unknown>;
    expect(Object.keys(schemas)).toContain("orders.OrderStatus");
    expect(Object.keys(schemas)).toContain("orders.CancelOrderInput");
    expect(Object.keys(schemas)).not.toContain("commerce.CommerceOptions");
  });

  it("answers a replica query with the ReplicaPage schema (ADR 0338)", () => {
    const ir: MemberIR = {
      ...COMMERCE_IR,
      classes: COMMERCE_IR.classes.map((candidate) =>
        candidate.name === "ListOrdersQuery"
          ? { ...candidate, handle: { input: "ListOrdersInput", replica: true } }
          : candidate,
      ),
    };
    const built = buildManifest(ir);
    const list = built.manifest.actions?.find((entry) => entry.class === "ListOrdersQuery");
    expect(list?.["output"]).toEqual({ $ref: "#/schemas/orders.ReplicaPage" });
    expect((built.manifest.schemas as Record<string, unknown>)["orders.ReplicaPage"]).toMatchObject(
      {
        type: "object",
        required: ["rows", "removed", "cursor", "asOf", "full"],
      },
    );
    expect(built.errors).toEqual(errors);
  });

  it("merges a hosted package's sections with `from`", () => {
    const ir: MemberIR = {
      ...COMMERCE_IR,
      dependencies: [
        {
          package: "@acme/loyalty-kit",
          manifest: {
            member: "loyalty_kit",
            package: "@acme/loyalty-kit",
            version: "0.4.0",
            permissions: [{ key: "loyalty_kit.loyalty_account.redeem", risk: "L3" }],
            actions: [
              {
                key: "loyalty_kit.loyalty_account.redeem@1",
                kind: "action",
                module: "loyalty_kit",
                class: "RedeemPointsAction",
                permission: "loyalty_kit.loyalty_account.redeem",
                risk: "L3",
                input: { $ref: "#/schemas/loyalty_kit.RedeemPointsInput" },
              },
            ],
          },
        },
      ],
    };
    const merged = buildManifest(ir).manifest;
    expect(merged.actions?.at(-1)).toMatchObject({
      key: "loyalty_kit.loyalty_account.redeem@1",
      from: "@acme/loyalty-kit",
      input: { $ref: "@acme/loyalty-kit#/schemas/loyalty_kit.RedeemPointsInput" },
    });
    expect(merged.permissions?.at(-1)).toMatchObject({
      key: "loyalty_kit.loyalty_account.redeem",
      from: "@acme/loyalty-kit",
    });
  });

  it("hosts the Integrations of two connector packages with egress, once each, and refuses one key from two", () => {
    const wallet = connectorPackage("wallet");
    const ir: MemberIR = {
      ...BILLING_IR,
      dependencies: [
        ...BILLING_IR.dependencies,
        ...CONNECTOR_PACKAGES,
        // a hosted member that already merged the wallet connector: the same Integration, kept once
        {
          package: "@acme/wallets",
          manifest: {
            member: "wallets",
            package: "@acme/wallets",
            version: "0.1.0",
            integrations: (
              wallet.manifest["integrations"] as readonly Record<string, unknown>[]
            ).map((entry) => ({ ...entry, from: wallet.package })),
          },
        },
      ],
    };
    const built = buildManifest(ir);
    expect(built.errors).toEqual([]);
    expect(built.manifest["integrations"]).toEqual([
      expect.objectContaining({ key: "billing.stripe" }),
      expect.objectContaining({
        key: "connector_wallet.wallet",
        connection: "WalletConnection",
        egress: { origin: "https://api.wallet.example" },
        from: "@figentra/connector-wallet",
      }),
      expect.objectContaining({
        key: "connector_paylink.paylink",
        egress: { origin: "https://api.paylink.example" },
        from: "@figentra/connector-paylink",
      }),
    ]);

    const fork = { ...wallet, package: "@acme/wallet-fork" };
    const clash = buildManifest({
      ...BILLING_IR,
      dependencies: [...BILLING_IR.dependencies, wallet, fork],
    });
    expect(clash.errors.map((error) => `${error.code} ${error.subject}`)).toEqual([
      "identity_collision @acme/wallet-fork",
    ]);
  });

  it("derives integration, sequence, searchable and job identities", () => {
    const billing = buildManifest(BILLING_IR);
    expect(billing.errors).toEqual([]);
    expect(billing.manifest["integrations"]).toEqual([
      {
        key: "billing.stripe",
        class: "StripeIntegration",
        module: "billing",
        file: "src/modules/billing/integrations/stripe.integration.ts",
        connection: "StripeConnection",
        connectionFile: "src/modules/billing/connections/stripe.connection.ts",
        webhookPath: "/webhooks/billing/stripe/:connectionId",
        roles: ["webhooks"],
      },
    ]);
    expect(billing.manifest["sequences"]).toEqual([
      {
        key: "billing.invoice",
        class: "InvoiceSequence",
        module: "billing",
        file: "src/modules/billing/database/sequences/invoice.sequence.ts",
      },
      {
        key: "segments.export",
        class: "SegmentExportSequence",
        module: "segments",
        file: "src/node/database/sequences/segment-export.sequence.ts",
        from: "@stackra/segments",
      },
    ]);
    expect(billing.manifest.models?.find((model) => model.key === "billing.invoice")).toMatchObject(
      {
        publicId: "inv",
        searchable: true,
      },
    );
    expect(billing.manifest.actions?.[0]).toMatchObject({
      key: "billing.invoice.send_reminders@1",
      job: { queue: "default", cron: { schedule: "0 9 * * *" } },
    });
    expect(billing.manifest.events?.[0]).toMatchObject({
      name: "billing.invoice.issued.v2",
      version: 2,
      webhook: true,
    });
  });

  it("refuses an event name that repeats the module or member key (event_name_prefixed, STA-1255)", () => {
    const paid = declared("OrderPaid");
    const named = (name: string, written: string): DeclaredClass => ({
      ...paid,
      name,
      options: { ...paid.options, name: written },
    });
    const { errors: prefixed } = buildManifest({
      ...COMMERCE_IR,
      classes: [
        ...COMMERCE_IR.classes.filter((candidate) => candidate !== paid),
        named("OrderPaid", "orders.order.paid"),
        named("OrderShipped", "commerce.order.shipped"),
        named("OrderPacked", "order.packed"),
      ],
    });
    expect(
      prefixed
        .filter((error) => error.code === "event_name_prefixed")
        .map((error) => [error.subject, error.fix.split("`")[1]]),
    ).toEqual([
      ["OrderPaid", 'name: "order.paid"'],
      ["OrderShipped", 'name: "order.shipped"'],
    ]);
  });

  it("derives an app's block and route keys, and no such section elsewhere", () => {
    const { manifest: app, errors: appErrors } = buildManifest(WEB_APP_IR);
    expect(appErrors).toEqual([]);
    expect(app["blocks"]).toEqual([
      {
        key: "web.cta_banner",
        class: "CtaBannerBlock",
        module: "web",
        file: "src/blocks/cta-banner/cta-banner.block.ts",
      },
    ]);
    expect(app["routes"]).toEqual([
      {
        key: "order_detail",
        class: "OrderDetailRoute",
        file: "src/routes/order-detail/order-detail.route.ts",
      },
      { key: "settings", class: "SettingsRoute", file: "src/routes/settings/settings.route.ts" },
    ]);
    expect(manifest["blocks"]).toBeUndefined();
    expect(manifest["routes"]).toBeUndefined();
  });

  it("checks public id prefixes against each other and the registry", () => {
    const order = declared("Order");
    const withPrefix = (name: string, prefix: string): DeclaredClass => ({
      ...order,
      name,
      file: `src/modules/orders/models/${name.toLowerCase()}.model.ts`,
      traits: [{ name: "HasPublicId", args: [prefix] }],
    });
    const ir: MemberIR = {
      ...COMMERCE_IR,
      classes: [
        ...COMMERCE_IR.classes,
        withPrefix("Receipt", "ord"),
        withPrefix("Ticket", "Tk"),
        withPrefix("Segment", "seg"),
      ],
    };
    const codes = buildManifest(ir).errors.map((error) => `${error.code} ${error.subject}`);
    expect(codes).toContain("prefix_duplicate Receipt");
    expect(codes).toContain("prefix_invalid Ticket");
    expect(codes).toContain("prefix_taken Segment");
    const hosted: MemberIR = {
      ...COMMERCE_IR,
      dependencies: [
        {
          package: "@acme/shipping",
          manifest: {
            member: "shipping",
            package: "@acme/shipping",
            version: "1.0.0",
            models: [
              { key: "shipping.order", table: "shipping.orders", publicId: "ord", traits: [] },
            ],
          },
        },
      ],
    };
    expect(buildManifest(hosted).errors).toMatchObject([
      { code: "prefix_duplicate", subject: "@acme/shipping" },
    ]);
  });

  it("refuses a sequence without a written key", () => {
    const ir: MemberIR = {
      ...BILLING_IR,
      classes: BILLING_IR.classes.map((candidate) =>
        candidate.name === "InvoiceSequence" ? { ...candidate, options: {} } : candidate,
      ),
    };
    expect(buildManifest(ir).errors.map((error) => `${error.code} ${error.subject}`)).toEqual([
      "identity_missing InvoiceSequence",
    ]);
  });

  it("refuses a sequence outside its module's database/sequences group", () => {
    const ir: MemberIR = {
      ...BILLING_IR,
      classes: BILLING_IR.classes.map((candidate) =>
        candidate.name === "InvoiceSequence"
          ? { ...candidate, file: "src/modules/billing/services/invoice.sequence.ts" }
          : candidate,
      ),
    };
    expect(buildManifest(ir).errors.map((error) => `${error.code} ${error.subject}`)).toEqual([
      "sequence_misplaced InvoiceSequence",
    ]);
  });

  it("checks each document number names a declared sequence", () => {
    expect(buildManifest(billingNumberedBy("invoice")).errors).toEqual([]);
    expect(buildManifest(billingNumberedBy("segments.export")).errors).toEqual([]);
    expect(
      buildManifest(billingNumberedBy("receipt")).errors.map(
        (error) => `${error.code} ${error.subject}`,
      ),
    ).toEqual(["document_number_unsequenced Invoice"]);
  });

  it("lists each declared rule outcome kind with its label and params, and refuses one without a key", () => {
    const sequence = BILLING_IR.classes.find((candidate) => candidate.name === "InvoiceSequence");
    if (sequence === undefined) throw new Error("no fixture sequence");
    const outcome = (options: Record<string, unknown>): DeclaredClass => ({
      ...sequence,
      name: "LateFee",
      kind: "rule_outcome",
      file: "src/modules/billing/rules/late-fee.outcome.ts",
      options,
    });
    const params = {
      amount: { type: "money", label: "billing::outcomes.amount", floor: "consumer.fee_cap" },
    };
    const withOutcome = (options: Record<string, unknown>): MemberIR => ({
      ...BILLING_IR,
      classes: [...BILLING_IR.classes, outcome(options)],
    });
    const listed = buildManifest(
      withOutcome({ key: "lateFee", label: "billing::outcomes.late_fee", params }),
    );
    expect(listed.errors).toEqual([]);
    expect(listed.manifest["outcomes"]).toEqual([
      {
        key: "billing.lateFee",
        class: "LateFee",
        module: "billing",
        file: "src/modules/billing/rules/late-fee.outcome.ts",
        label: "billing::outcomes.late_fee",
        params,
      },
    ]);
    expect(
      buildManifest(withOutcome({ label: "x" })).errors.map(
        (error) => `${error.code} ${error.subject}`,
      ),
    ).toEqual(["identity_missing LateFee"]);
  });

  it("lists agents, pass kinds and entitlements with their derived keys and gates (STA-903)", () => {
    const order = { $class: "Order", from: "#modules/orders/models/order.model", kind: "model" };
    const exports = { $class: "ExportsEntitlement", from: "#x", kind: "entitlement" };
    const ir: MemberIR = {
      ...COMMERCE_IR,
      classes: [
        ...COMMERCE_IR.classes.map((candidate) =>
          candidate.name === "ListOrdersQuery"
            ? { ...candidate, options: { ...candidate.options, entitlement: exports } }
            : candidate,
        ),
        kindClass(
          "CreateOrderAction",
          "action",
          "src/modules/orders/actions/create-order.action.ts",
          {
            key: "order.create",
            actors: ["user"],
            idempotency: "optional",
          },
        ),
        kindClass(
          "OrderLimitEntitlement",
          "entitlement",
          "src/modules/orders/access/order-limit.entitlement.ts",
          { kind: "limit", counts: order, where: { archivedAt: null } },
        ),
        kindClass(
          "ExportsEntitlement",
          "entitlement",
          "src/modules/orders/access/exports.entitlement.ts",
          { kind: "feature" },
        ),
        kindClass(
          "OrderAssistantAgent",
          "agent",
          "src/modules/orders/ai/order-assistant.agent.ts",
          {
            key: "order_assistant",
            task: "chat",
            tools: [{ $class: "ListOrdersQuery", from: "#q", kind: "query" }],
          },
        ),
        kindClass("ReceiptPass", "pass", "src/modules/orders/integrations/receipt.pass.ts", {
          key: "receipt",
        }),
      ],
    };
    const built = buildManifest(ir);
    expect(built.errors).toEqual([]);
    expect(built.manifest["entitlements"]).toEqual([
      {
        key: "orders.order_limit",
        class: "OrderLimitEntitlement",
        module: "orders",
        file: "src/modules/orders/access/order-limit.entitlement.ts",
        kind: "limit",
        counts: "orders.order",
        where: { archivedAt: null },
        gates: ["orders.order.create@1"],
      },
      {
        key: "orders.exports",
        class: "ExportsEntitlement",
        module: "orders",
        file: "src/modules/orders/access/exports.entitlement.ts",
        kind: "feature",
        gates: ["orders.order.list@1"],
      },
    ]);
    expect(built.manifest["agents"]).toEqual([
      {
        key: "order_assistant",
        class: "OrderAssistantAgent",
        module: "orders",
        file: "src/modules/orders/ai/order-assistant.agent.ts",
        task: "chat",
        tools: ["orders.order.list@1"],
      },
    ]);
    expect(built.manifest["passes"]).toEqual([
      {
        key: "receipt",
        class: "ReceiptPass",
        module: "orders",
        file: "src/modules/orders/integrations/receipt.pass.ts",
      },
    ]);
    const unkeyed = buildManifest({
      ...ir,
      classes: [
        ...COMMERCE_IR.classes,
        kindClass("BarePass", "pass", "src/modules/orders/integrations/bare.pass.ts", {}),
      ],
    });
    expect(unkeyed.errors.map((error) => `${error.code} ${error.subject}`)).toEqual([
      "identity_missing BarePass",
    ]);
  });

  it("takes an Integration's written key, refuses a malformed one and a collision (STA-1739)", () => {
    expect(buildManifest(keyed("connectors.stripe")).manifest["integrations"]).toEqual([
      expect.objectContaining({ key: "connectors.stripe", class: "StripeIntegration" }),
    ]);
    expect(
      buildManifest(keyed("Connectors.Stripe")).errors.map(
        (error) => `${error.code} ${error.subject}`,
      ),
    ).toEqual(["integration_key_invalid StripeIntegration"]);
    expect(
      buildManifest(keyed("connectors.stripe", "connectors.stripe")).errors.map(
        (error) => error.code,
      ),
    ).toContain("identity_collision");
  });

  it("locks an Integration's egress entry, a {field} host kept as data, and refuses a base URL it cannot call", () => {
    expect(buildManifest(withBase("https://api.stripe.com/v1")).manifest["integrations"]).toEqual([
      expect.objectContaining({ egress: { origin: "https://api.stripe.com" } }),
    ]);
    expect(
      buildManifest(withBase("https://{region}.api.stripe.com")).manifest["integrations"],
    ).toEqual([
      expect.objectContaining({
        egress: { origin: "https://{region}.api.stripe.com", fields: ["region"] },
      }),
    ]);
    expect(buildManifest(withBase("{baseUrl}")).manifest["integrations"]).toEqual([
      expect.objectContaining({ egress: { origin: "{baseUrl}", fields: ["baseUrl"] } }),
    ]);
    expect(
      buildManifest(withBase("http://api.stripe.com")).errors.map(
        (error) => `${error.code} ${error.subject}`,
      ),
    ).toEqual(["egress_invalid StripeIntegration"]);
  });

  /** Only Standard Webhooks brings its own event id; any other scheme must name one, or the inbox keeps one event. */
  it("refuses an Integration whose webhooks name no event id, unless the scheme is Standard Webhooks", () => {
    expect(codesOf(receiving({ scheme: "hmac" }))).toContain(
      "webhook_event_id_undeclared StripeIntegration",
    );
    expect(codesOf(receiving({ scheme: "aes_gcm_body", recipe: { ivHeader: "x-iv" } }))).toContain(
      "webhook_event_id_undeclared StripeIntegration",
    );
    for (const webhooks of [
      { scheme: "standard_webhooks" },
      { scheme: "hmac", eventId: { path: "id" } },
      { scheme: "keyed_field_digest", eventId: { parts: [{ path: "ref" }, { header: "x-at" }] } },
      { scheme: "hmac", signature: { idHeader: "x-event-id" } },
    ])
      expect(codesOf(receiving(webhooks))).not.toContain(
        "webhook_event_id_undeclared StripeIntegration",
      );
  });

  it("reports colliding, duplicate, unknown and missing identities", () => {
    const cancel = declared("CancelOrderAction");
    const ir: MemberIR = {
      ...COMMERCE_IR,
      classes: [
        ...COMMERCE_IR.classes,
        {
          ...cancel,
          name: "VoidOrderAction",
          file: "src/modules/orders/actions/void-order.action.ts",
        },
        { ...cancel, name: "RefundOrderAction", options: { key: "order.refund" } },
        { ...cancel, name: "NoKeyAction", options: {} },
        {
          ...declared("CommerceConfig"),
          name: "AnalyticsConfig",
          base: { name: "AnalyticsConfig", from: "@stackra/analytics", own: false },
        },
        {
          ...declared("CommerceConfig"),
          name: "OtherAnalyticsConfig",
          base: { name: "AnalyticsConfig", from: "@stackra/analytics", own: false },
        },
      ],
    };
    const codes = buildManifest(ir).errors.map((error) => `${error.code} ${error.subject}`);
    expect(codes).toContain("identity_collision VoidOrderAction");
    expect(codes).toContain("permission_unknown RefundOrderAction");
    expect(codes).toContain("identity_missing NoKeyAction");
    expect(codes).toContain("override_duplicate OtherAnalyticsConfig");
  });

  it("treats a class that only builds on a package class as no override (ADR 0305 rule 1)", () => {
    const input = declared("CommerceConfig");
    const cursor = (name: string): DeclaredClass => ({
      ...input,
      kind: "schema",
      name,
      base: { name: "CursorInput", from: "@stackra/validation", own: false },
    });
    const ir: MemberIR = {
      ...COMMERCE_IR,
      classes: [...COMMERCE_IR.classes, cursor("ListNotesInput"), cursor("ListCommentsInput")],
    };
    const codes = buildManifest(ir).errors.map((error) => error.code);
    expect(codes).not.toContain("override_duplicate");
  });

  it("refuses an action whose permission is L0 or L1, and lets a query read at L1", () => {
    const permissions = declared("OrderPermissions");
    const ir = (cancel: string): MemberIR => ({
      ...COMMERCE_IR,
      classes: [
        ...COMMERCE_IR.classes.filter((item) => item.name !== permissions.name),
        { ...permissions, statics: { ...permissions.statics, read: "Permission.L1", cancel } },
      ],
    });
    expect(codesOf(ir("Permission.L1"))).toContain("action_risk_below_write CancelOrderAction");
    expect(codesOf(ir("Permission.L0"))).toContain("action_risk_below_write CancelOrderAction");
    expect(codesOf(ir("Permission.L2.system()"))).not.toContain(
      "action_risk_below_write CancelOrderAction",
    );
    expect(codesOf(ir("Permission.L2")).filter((code) => code.startsWith("action_risk"))).toEqual(
      [],
    );
  });

  it("gives a query its own verb only when its Permissions class declares it", () => {
    const list = declared("ListOrdersQuery");
    const permissions = declared("OrderPermissions");
    const ir: MemberIR = {
      ...COMMERCE_IR,
      classes: [
        ...COMMERCE_IR.classes.filter((item) => item.name !== permissions.name),
        { ...permissions, statics: { ...permissions.statics, search: "Permission.L1" } },
        { ...list, name: "SearchOrdersQuery", options: { ...list.options, key: "order.search" } },
        { ...list, name: "FeedOrdersQuery", options: { ...list.options, key: "order.feed" } },
      ],
    };
    const { manifest: built, errors: refused } = buildManifest(ir);
    const permissionOf = (name: string): unknown =>
      (built.actions ?? []).find((entry) => entry["class"] === name)?.["permission"];
    expect(refused.map((error) => error.code)).not.toContain("permission_unknown");
    expect(permissionOf("SearchOrdersQuery")).toBe("orders.order.search");
    expect(permissionOf("FeedOrdersQuery")).toBe("orders.order.read");
    expect(permissionOf("ListOrdersQuery")).toBe("orders.order.read");
  });

  it("lets the member named after a package host its model with the package's prefix", () => {
    const order = declared("Order");
    const account: DeclaredClass = {
      ...order,
      name: "Account",
      module: "accounts",
      file: "src/modules/accounts/models/account.model.ts",
      traits: [{ name: "HasPublicId", args: ["usr"] }],
    };
    const identity: MemberIR = { ...COMMERCE_IR, member: "identity", classes: [account] };
    const { manifest: built, errors: refused } = buildManifest(identity);
    expect(refused.map((error) => error.code)).not.toContain("prefix_taken");
    expect(built.models?.find((model) => model.key === "accounts.account")).toMatchObject({
      publicId: "usr",
      hosts: "identity.user",
    });
    const elsewhere = buildManifest({ ...identity, member: "crm" }).errors;
    expect(elsewhere.map((error) => `${error.code} ${error.subject}`)).toContain(
      "prefix_taken Account",
    );
  });

  describe("tools, effects, listings and replacements", () => {
    const cancel = declared("CancelOrderAction");
    const withClasses = (...classes: DeclaredClass[]): MemberIR => ({
      ...COMMERCE_IR,
      classes: [...COMMERCE_IR.classes.filter((item) => item.name !== cancel.name), ...classes],
    });

    it("records an action's data class and refuses one gen cannot read (STA-2594)", () => {
      const financial = { ...cancel, options: { ...cancel.options, dataClass: "financial" } };
      const { errors: found } = buildManifest(withClasses(financial));
      expect(found).toEqual([]);
      expect(cancelEntryOf(withClasses(financial))?.["dataClass"]).toBe("financial");
      expect(cancelEntryOf(withClasses(cancel))?.["dataClass"]).toBeUndefined();
      const unread = {
        ...cancel,
        options: { ...cancel.options, dataClass: { $class: "LocalClass", from: "#node/x" } },
      };
      expect(codesOf(withClasses(unread))).toContain("data_class_unknown CancelOrderAction");
    });

    it("refuses `tool: false` on a user action without a reason, and records the reason", () => {
      const off = { ...cancel, options: { ...cancel.options, tool: false } };
      expect(codesOf(withClasses(off))).toContain("tool_reason_missing CancelOrderAction");
      const reasoned = { ...off, options: { ...off.options, toolReason: "needs a card reader" } };
      const { manifest: built, errors: found } = buildManifest(withClasses(reasoned));
      expect(found).toEqual([]);
      const entry = built.actions?.find((action) => action.class === "CancelOrderAction");
      expect(entry?.["tool"]).toBeUndefined();
      expect(entry?.["toolOff"]).toBe("needs a card reader");
    });

    it("makes an L3 or L4 user action a tool only with `tool: true` and a reason", () => {
      const permissions = COMMERCE_IR.classes.find(
        (item) => item.name === "OrderPermissions",
      ) as DeclaredClass;
      const atL3 = (action: DeclaredClass): MemberIR => ({
        ...COMMERCE_IR,
        classes: [
          ...COMMERCE_IR.classes.filter(
            (item) => item.name !== cancel.name && item.name !== permissions.name,
          ),
          { ...permissions, statics: { ...permissions.statics, cancel: "Permission.L3" } },
          action,
        ],
      });

      // An L3 action a user calls needs a step-up anyway (step_up_missing).
      const stepped = { ...cancel, options: { ...cancel.options, stepUp: "aal2" } };
      expect(buildManifest(atL3(stepped)).errors).toEqual([]);
      expect(cancelEntryOf(atL3(stepped))?.["tool"]).toBeUndefined();
      expect(cancelEntryOf(atL3(stepped))?.["toolOff"]).toContain("risk L3");
      const on = { ...stepped, options: { ...stepped.options, tool: true } };
      expect(codesOf(atL3(on))).toContain("tool_reason_missing CancelOrderAction");
      const reasoned = { ...on, options: { ...on.options, toolReason: "staff cancel by chat" } };
      expect(buildManifest(atL3(reasoned)).errors).toEqual([]);
      expect(cancelEntryOf(atL3(reasoned))?.["tool"]).toMatchObject({
        default: false,
        reason: "staff cancel by chat",
      });
    });

    it("marks a public action and refuses one with no endpoint to publish", () => {
      const published = { ...cancel, options: { ...cancel.options, public: true } };
      const { manifest: built, errors: found } = buildManifest(withClasses(published));
      expect(found).toEqual([]);
      expect(
        built.actions?.find((action) => action.class === "CancelOrderAction")?.["public"],
      ).toBe(true);
      expect(
        buildManifest(withClasses(cancel)).manifest.actions?.find(
          (action) => action.class === "CancelOrderAction",
        )?.["public"],
      ).toBeUndefined();
      const hidden = { ...published, options: { ...published.options, endpoint: false } };
      expect(codesOf(withClasses(hidden))).toContain("public_without_endpoint CancelOrderAction");
    });

    it("marks a stream action and refuses a stream option and output that disagree (G1b)", () => {
      const streamed = {
        ...cancel,
        options: {
          ...cancel.options,
          stream: true,
          tool: false,
          toolReason: "a stream reaches one live caller",
          idempotency: "never",
        },
        handle: {
          ...(cancel.handle?.input === undefined ? {} : { input: cancel.handle.input }),
          stream: true as const,
        },
      };
      expect(codesOf(withClasses(streamed))).toEqual([]);
      const entry = buildManifest(withClasses(streamed)).manifest.actions?.find(
        (action) => action.class === "CancelOrderAction",
      );
      expect(entry?.["stream"]).toBe(true);
      expect(entry?.["output"]).toBeUndefined();
      const optionOnly = {
        ...streamed,
        handle: cancel.handle?.input === undefined ? {} : { input: cancel.handle.input },
      };
      expect(codesOf(withClasses(optionOnly))).toContain(
        "stream_output_mismatch CancelOrderAction",
      );
      const outputOnly = { ...streamed, options: cancel.options };
      expect(codesOf(withClasses(outputOnly))).toContain(
        "stream_output_mismatch CancelOrderAction",
      );
    });

    it("keeps a system-only action off the tool list without a reason", () => {
      const system = { ...cancel, options: { ...cancel.options, actors: ["system"] } };
      const { manifest: built, errors: found } = buildManifest(withClasses(system));
      expect(found).toEqual([]);
      expect(
        built.actions?.find((action) => action.class === "CancelOrderAction")?.["tool"],
      ).toBeUndefined();
    });

    it("records effect tags, derives the hints from them and refuses an unknown tag", () => {
      const tagged = {
        ...cancel,
        options: {
          ...cancel.options,
          effects: ["financial", "external_communication", "irreversible"],
        },
      };
      const entry = buildManifest(withClasses(tagged)).manifest.actions?.find(
        (action) => action.class === "CancelOrderAction",
      );
      expect(entry?.["effects"]).toEqual(["financial", "external_communication", "irreversible"]);
      expect(entry?.["tool"]).toMatchObject({
        default: true,
        hints: { destructiveHint: true, openWorldHint: true, readOnlyHint: false },
      });
      const unknown = { ...cancel, options: { ...cancel.options, effects: ["spooky"] } };
      expect(codesOf(withClasses(unknown))).toContain("effect_unknown CancelOrderAction");
    });

    it("refuses a route whose path parameter is no field of the input (endpoint_param_unbound, STA-2063)", () => {
      // CancelOrderInput declares orderId, so PUT /orders/:orderId/cancel binds.
      expect(codesOf(withClasses(cancel))).not.toContain(
        "endpoint_param_unbound CancelOrderAction",
      );
      const renamed = {
        ...cancel,
        options: { ...cancel.options, endpoint: { method: "PUT", path: "/orders/:id/cancel" } },
      };
      expect(codesOf(withClasses(renamed))).toContain("endpoint_param_unbound CancelOrderAction");
      const get = {
        ...declared("ListOrdersQuery"),
        name: "GetOrderQuery",
        options: { key: "order.get" },
      };
      // GET /orders/:orderId with ListOrdersInput, then with no input at all.
      expect(codesOf(withClasses(cancel, get))).toContain("endpoint_param_unbound GetOrderQuery");
      const bare = { ...get, handle: { output: "ListOrdersOutput" } };
      expect(codesOf(withClasses(cancel, bare))).toContain("endpoint_param_unbound GetOrderQuery");
    });

    it("records an Integration's roles and listing, and refuses an unknown role", () => {
      const stripe = BILLING_IR.classes.find((item) => item.name === "StripeIntegration");
      if (stripe === undefined) throw new Error("no StripeIntegration fixture");
      const listed = {
        ...stripe,
        options: {
          ...stripe.options,
          roles: ["driver", "connector"],
          listing: { entitlement: "billing.stripe" },
        },
      };
      const ir: MemberIR = {
        ...BILLING_IR,
        classes: BILLING_IR.classes.map((item) => (item === stripe ? listed : item)),
      };
      expect(buildManifest(ir).manifest["integrations"]).toEqual([
        expect.objectContaining({
          roles: ["driver", "connector", "webhooks"],
          listing: { entitlement: "billing.stripe" },
        }),
      ]);
      const wrong = { ...stripe, options: { ...stripe.options, roles: ["reseller"] } };
      const codes = buildManifest({
        ...BILLING_IR,
        classes: BILLING_IR.classes.map((item) => (item === stripe ? wrong : item)),
      }).errors.map((error) => `${error.code} ${error.subject}`);
      expect(codes).toContain("integration_role_unknown StripeIntegration");
    });

    it("lists each `@Replaces` replacement", () => {
      const service = COMMERCE_IR.classes.find((item) => item.kind === "service");
      if (service === undefined) throw new Error("no service fixture");
      const replacing = {
        ...service,
        facets: [
          ...service.facets,
          {
            name: "Replaces",
            kind: "replaces",
            target: "class" as const,
            options: { $class: "TaxService", from: "@stackra/pricing" },
            from: "@stackra/container",
          },
        ],
      };
      const ir: MemberIR = {
        ...COMMERCE_IR,
        classes: COMMERCE_IR.classes.map((item) => (item === service ? replacing : item)),
      };
      expect(buildManifest(ir).manifest["replaces"]).toEqual([
        {
          class: service.name,
          file: service.file,
          replaces: "TaxService",
          from: "@stackra/pricing",
        },
      ]);
    });
  });
});

/** A manifest's `LoyaltyService` entries alone; the kit's actions and queries sit beside them in `services`. */
function servicesOf(manifest: Record<string, unknown>): readonly { class: string }[] {
  return (manifest["services"] as readonly { class: string }[]).filter(
    (entry) => entry.class === "LoyaltyService",
  );
}

describe("buildManifest's package services", () => {
  it("records the model a CrudService<M> is typed against, so a host registers the pair", () => {
    const ir: MemberIR = {
      ...LOYALTY_KIT_IR,
      classes: LOYALTY_KIT_IR.classes.map((candidate) =>
        candidate.name === "LoyaltyService"
          ? {
              ...candidate,
              partner: { name: "LoyaltyAccount", from: "#node/models/loyalty-account.model" },
            }
          : candidate,
      ),
    };
    expect(servicesOf(buildManifest(ir).manifest)).toEqual([
      expect.objectContaining({
        class: "LoyaltyService",
        partner: { name: "LoyaltyAccount", from: expect.stringMatching(/^@acme\/loyalty-kit/) },
      }),
    ]);
    expect(servicesOf(buildManifest(LOYALTY_KIT_IR).manifest)).toEqual([
      expect.not.objectContaining({ partner: expect.anything() }),
    ]);
  });
});

describe("buildManifest's package drivers (STA-1297)", () => {
  it("records each candidate's class, entry and tokens, and the config class that selects one", () => {
    const ir: MemberIR = {
      ...LOYALTY_KIT_IR,
      classes: LOYALTY_KIT_IR.classes.map((candidate) =>
        candidate.name === "MemoryLoyaltyLedgerDriver"
          ? {
              ...candidate,
              deps: [
                { class: { name: "LoyaltyKitConfig", from: "#config/loyalty-kit.config" } },
                { class: { name: "Clock", from: "@stackra/contracts" } },
              ],
            }
          : candidate,
      ),
    };
    expect(buildManifest(ir).manifest.drivers).toEqual([
      {
        port: "LoyaltyLedger",
        key: "loyalty_kit.LoyaltyLedger",
        candidates: ["memory"],
        selectedBy: "config:loyalty_kit.ledger",
        classes: {
          memory: {
            class: "MemoryLoyaltyLedgerDriver",
            from: "@acme/loyalty-kit",
            deps: [
              { class: { name: "LoyaltyKitConfig", from: "@acme/loyalty-kit" } },
              { class: { name: "Clock", from: "@stackra/contracts" } },
            ],
          },
        },
        config: { class: "LoyaltyKitConfig", from: "@acme/loyalty-kit" },
      },
    ]);
  });

  it("lists no abstract driver, the base its candidates extend", () => {
    const memory = LOYALTY_KIT_IR.classes.find(
      (candidate) => candidate.name === "MemoryLoyaltyLedgerDriver",
    );
    if (memory === undefined) throw new Error("the fixture has no memory ledger driver");
    const ir: MemberIR = {
      ...LOYALTY_KIT_IR,
      classes: [
        ...LOYALTY_KIT_IR.classes,
        {
          ...memory,
          name: "AreaLoyaltyLedgerDriver",
          file: "src/core/drivers/area-loyalty-ledger.driver.ts",
          importPath: "#core/drivers/area-loyalty-ledger.driver",
          abstract: true,
        },
      ],
    };
    const [driver] = buildManifest(ir).manifest.drivers ?? [];
    expect(driver?.candidates).toEqual(["memory"]);
    expect(JSON.stringify(driver)).not.toContain("AreaLoyaltyLedgerDriver");
  });

  it("lists no internal driver, a helper its package keeps", () => {
    const memory = LOYALTY_KIT_IR.classes.find(
      (candidate) => candidate.name === "MemoryLoyaltyLedgerDriver",
    );
    if (memory === undefined) throw new Error("the fixture has no memory ledger driver");
    const ir: MemberIR = {
      ...LOYALTY_KIT_IR,
      classes: [
        ...LOYALTY_KIT_IR.classes,
        {
          ...memory,
          name: "ConsoleLoyaltyLedgerDriver",
          file: "src/core/drivers/console-loyalty-ledger.driver.ts",
          importPath: "#core/drivers/console-loyalty-ledger.driver",
          options: { internal: true },
        },
      ],
    };
    const [driver] = buildManifest(ir).manifest.drivers ?? [];
    expect(driver?.candidates).toEqual(["memory"]);
    expect(JSON.stringify(driver)).not.toContain("ConsoleLoyaltyLedgerDriver");
  });

  it("keeps a service's drivers to names", () => {
    const [driver] = buildManifest(COMMERCE_IR).manifest.drivers ?? [];
    expect(driver).not.toHaveProperty("classes");
  });
});

describe("buildManifest's package config section (STA-1308)", () => {
  it("lists a package's config classes with their key and public entry", () => {
    expect(buildManifest(LOYALTY_KIT_IR).manifest["config"]).toEqual([
      { key: "loyalty_kit", class: "LoyaltyKitConfig", from: "@acme/loyalty-kit" },
    ]);
  });

  it("writes no config section for a service", () => {
    expect(buildManifest(COMMERCE_IR).manifest).not.toHaveProperty("config");
  });
});

const local = (name: string) => ({ $class: name, from: "#x", kind: "entitlement" });
const hosted = (name: string, kind: string) => ({
  $class: name,
  from: "@acme/kit",
  kind,
});
const build = (classes: DeclaredClass[], dependencies: MemberIR["dependencies"] = []) =>
  buildManifest({ ...COMMERCE_IR, classes: [...COMMERCE_IR.classes, ...classes], dependencies });

/** A hosted kit action entry, with the fields a manifest action entry requires. */
const kitAction = (key: string, cls: string, extra: Record<string, unknown> = {}) => ({
  key,
  kind: "action",
  module: "content",
  class: cls,
  permission: "content.custom_field.create",
  risk: "L2",
  ...extra,
});
const kit = (
  gates: string[] = [],
  kitActions: readonly ReturnType<typeof kitAction>[] = [
    kitAction("content.custom_field.create@1", "CreateCustomFieldAction"),
  ],
): NonNullable<MemberIR["dependencies"]>[number] => ({
  package: "@acme/kit",
  manifest: {
    member: "kit",
    package: "@acme/kit",
    version: "1.0.0",
    models: [
      {
        key: "content.custom_field",
        class: "CustomField",
        table: "content.custom_fields",
        publicId: "cfd",
        traits: [],
      },
    ],
    entitlements: [
      { key: "collaboration.live_collaboration", class: "LiveCollaborationEntitlement", gates },
    ],
    actions: kitActions,
  },
});
// The fixture's OrderPermissions declares read, create and cancel only.
const call = (kind: string, name: string, key: string, options: Record<string, unknown>) =>
  kindClass(name, kind, `src/modules/orders/${kind}s/${key}.${kind}.ts`, {
    key,
    actors: ["user"],
    permission: "orders.order.create",
    ...options,
  });
const action = (name: string, key: string, options: Record<string, unknown>) =>
  call("action", name, key, { idempotency: "optional", ...options });
const entitlement = (name: string, options: Record<string, unknown>) =>
  kindClass(name, "entitlement", `src/modules/orders/access/${name}.entitlement.ts`, options);
/** The entitlements section of `built`, as entries. */
const entitlementsOf = (built: ReturnType<typeof build>) =>
  (built.manifest.entitlements ?? []) as readonly Record<string, unknown>[];
const gatesOf = (built: ReturnType<typeof build>, key: string) =>
  entitlementsOf(built).find((e) => e["key"] === key)?.["gates"];

describe("buildManifest's entitlement gates (STA-2059)", () => {
  it("gates the action that names a local entitlement and records the key", () => {
    const built = build([
      entitlement("ExportsEntitlement", { kind: "feature" }),
      action("ExportOrdersAction", "order.export", { entitlement: local("ExportsEntitlement") }),
    ]);
    expect(built.errors).toEqual([]);
    expect(gatesOf(built, "orders.exports")).toEqual(["orders.order.export@1"]);
    expect(
      built.manifest.actions?.find((a) => a["class"] === "ExportOrdersAction")?.["entitlements"],
    ).toEqual(["orders.exports"]);
  });

  it("records a list of entitlements once each, sorted, and gates the action by each", () => {
    const built = build([
      entitlement("ExportsEntitlement", { kind: "feature" }),
      entitlement("BulkEntitlement", { kind: "feature" }),
      action("ExportOrdersAction", "order.export", {
        entitlement: [
          local("ExportsEntitlement"),
          local("BulkEntitlement"),
          local("ExportsEntitlement"),
        ],
      }),
    ]);
    expect(built.errors).toEqual([]);
    expect(
      built.manifest.actions?.find((a) => a["class"] === "ExportOrdersAction")?.["entitlements"],
    ).toEqual(["orders.bulk", "orders.exports"]);
    expect(gatesOf(built, "orders.bulk")).toEqual(["orders.order.export@1"]);
    expect(gatesOf(built, "orders.exports")).toEqual(["orders.order.export@1"]);
  });

  it("gates exactly the actions that feed a quota's meter", () => {
    const built = build([
      entitlement("TokenQuotaEntitlement", { kind: "quota", meter: "ai.tokens", per: "month" }),
      action("ChatAction", "order.chat", { meter: { name: "ai.tokens", kind: "sum" } }),
      action("OtherAction", "order.other", { meter: { name: "ai.other", kind: "count" } }),
    ]);
    expect(built.errors).toEqual([]);
    expect(entitlementsOf(built).find((e) => e["key"] === "orders.token_quota")).toMatchObject({
      meter: "ai.tokens",
      per: "month",
      gates: ["orders.order.chat@1"],
    });
  });

  it("never gates a query whose key shares a limit's create prefix (EC-04)", () => {
    const built = build([
      entitlement("OrderLimitEntitlement", {
        kind: "limit",
        counts: { $class: "Order", from: "#modules/orders/models/order.model", kind: "model" },
      }),
      call("query", "PreviewOrderQuery", "order.create", { permission: "orders.order.read" }),
    ]);
    expect(built.errors).toEqual([]);
    expect(gatesOf(built, "orders.order_limit")).toEqual([]);
  });

  it("gates a host action by a hosted entitlement and a host limit by a hosted model's create", () => {
    const built = build(
      [
        action("LiveAction", "order.live", {
          entitlement: hosted("LiveCollaborationEntitlement", "entitlement"),
        }),
        entitlement("FieldLimitEntitlement", {
          kind: "limit",
          counts: hosted("CustomField", "model"),
        }),
      ],
      [kit()],
    );
    expect(built.errors).toEqual([]);
    const all = entitlementsOf(built);
    expect(all.find((e) => e["key"] === "collaboration.live_collaboration")).toMatchObject({
      from: "@acme/kit",
      gates: ["orders.order.live@1"],
    });
    expect(all.find((e) => e["key"] === "orders.field_limit")).toMatchObject({
      counts: "content.custom_field",
      gates: ["content.custom_field.create@1"],
    });
  });

  it("keeps a hosted entitlement's own gates and adds the host's, each once (EC-03)", () => {
    const built = build(
      [
        action("LiveAction", "order.live", {
          entitlement: hosted("LiveCollaborationEntitlement", "entitlement"),
        }),
      ],
      [
        kit(
          ["content.custom_field.archive@1", "content.custom_field.create@1"],
          [
            kitAction("content.custom_field.create@1", "CreateCustomFieldAction", {
              entitlements: ["collaboration.live_collaboration"],
            }),
          ],
        ),
      ],
    );
    expect(built.errors).toEqual([]);
    expect(gatesOf(built, "collaboration.live_collaboration")).toEqual([
      "content.custom_field.archive@1",
      "content.custom_field.create@1",
      "orders.order.live@1",
    ]);
  });

  it("resolves a class imported from a hosted package to the hosted entitlement, past a local namesake", () => {
    const built = build(
      [
        entitlement("LiveCollaborationEntitlement", { kind: "feature" }),
        action("LiveAction", "order.live", {
          entitlement: hosted("LiveCollaborationEntitlement", "entitlement"),
        }),
      ],
      [kit()],
    );
    expect(built.errors).toEqual([]);
    expect(
      built.manifest.actions?.find((a) => a["class"] === "LiveAction")?.["entitlements"],
    ).toEqual(["collaboration.live_collaboration"]);
    expect(gatesOf(built, "orders.live_collaboration")).toEqual([]);
  });

  it("refuses an unknown entitlement, a non-class entitlement and an unknown counted model", () => {
    const built = build([
      action("BadAction", "order.bad", { entitlement: local("NoSuchEntitlement") }),
      action("ValueAction", "order.value", { entitlement: "orders.exports" }),
      entitlement("GhostLimitEntitlement", { kind: "limit", counts: hosted("Ghost", "model") }),
    ]);
    expect(built.errors.map((error) => `${error.code} ${error.subject}`)).toEqual([
      "entitlement_unknown BadAction",
      "entitlement_unknown ValueAction",
      "entitlement_counts_unknown GhostLimitEntitlement",
    ]);
    expect(built.errors[1]?.message).toContain("names a value");
  });

  it("refuses a hosted action naming an entitlement no hosted package brings (EC-02)", () => {
    const built = build(
      [],
      [
        kit(
          [],
          [
            kitAction("content.custom_field.create@1", "CreateCustomFieldAction", {
              entitlements: ["billing.premium"],
            }),
          ],
        ),
      ],
    );
    expect(built.errors.map((error) => `${error.code} ${error.subject}`)).toEqual([
      "entitlement_unknown @acme/kit",
    ]);
  });
});

/** The commerce member plus one settings class whose `mode` field is of `type`. */
const withMode = (type: TypeDesc): MemberIR => ({
  ...COMMERCE_IR,
  shapes: [
    ...COMMERCE_IR.shapes,
    {
      name: "OrdersSettings",
      kind: "settings",
      module: "orders",
      file: "src/modules/orders/orders.settings.ts",
      importPath: "#modules/orders/orders.settings",
      fields: [{ name: "mode", optional: false, nullable: false, type, rules: [] }],
      relations: [],
    },
  ],
});

describe("buildManifest's settings section (STA-2056)", () => {
  it("writes one entry per own settings class", () => {
    const { manifest, errors } = buildManifest(withMode({ kind: "boolean" }));
    expect(errors).toEqual([]);
    expect(manifest["settings"]).toEqual([
      {
        key: "orders",
        class: "OrdersSettings",
        module: "orders",
        file: "src/modules/orders/orders.settings.ts",
        keys: [{ path: "mode", type: "boolean" }],
      },
    ]);
  });

  it("joins the settings refusals", () => {
    expect(buildManifest(withMode({ kind: "json" })).errors.map((error) => error.code)).toEqual([
      "settings_unsupported_type",
    ]);
  });

  it("writes no section for a member with no settings class", () => {
    expect(buildManifest(COMMERCE_IR).manifest).not.toHaveProperty("settings");
  });
});

describe("buildManifest's relay section (STA-1910)", () => {
  it("lists the keys and subscribers of each runway environment, without origins", () => {
    expect(buildManifest(PRODUCER_IR).manifest.relay).toEqual({
      keys: {
        dev: [{ id: "pay-dev-1", publicKey: "cGF5LWRldi1wdWJsaWM" }],
        prod: [{ id: "pay-prod-1", publicKey: "cGF5LXByb2QtcHVibGlj" }],
      },
      subscribers: {
        dev: [{ member: "billing", events: ["payments.payment.captured.v1"] }],
        prod: [],
      },
    });
  });

  it("is absent when no environment has an events block", () => {
    expect("relay" in buildManifest(INBOX_IR).manifest).toBe(false);
  });
});

/** A class of the orders module at `file`. */
function ordersClass(file: string, name: string, kind: string): DeclaredClass {
  return {
    ...declared("CommerceConfig"),
    name,
    kind,
    module: "orders",
    file,
    importPath: `#modules/orders/${file}`,
    options: {},
    deps: [],
  };
}

describe("buildManifest's seeders and factories sections (STA-2061)", () => {
  const ir: MemberIR = {
    ...COMMERCE_IR,
    classes: [
      ...COMMERCE_IR.classes,
      ordersClass(
        "src/modules/orders/database/seeders/demo.seeder.ts",
        "OrdersDemoSeeder",
        "seeder",
      ),
      {
        ...ordersClass(
          "src/modules/orders/database/factories/order.factory.ts",
          "OrderFactory",
          "factory",
        ),
        partner: { name: "Order", from: "#modules/orders/models/order.model" },
      },
      ordersClass(
        "src/modules/orders/database/factories/loose.factory.ts",
        "LooseFactory",
        "factory",
      ),
    ],
  };

  it("records the seeders and the partnered factories (@covers sta-2061:FR-002, FR-003)", () => {
    const { manifest } = buildManifest(ir);
    expect(manifest["seeders"]).toEqual([
      {
        key: "orders.demo",
        module: "orders",
        profile: "demo",
        class: "OrdersDemoSeeder",
        file: "src/modules/orders/database/seeders/demo.seeder.ts",
      },
    ]);
    expect(manifest["factories"]).toEqual([
      {
        class: "OrderFactory",
        file: "src/modules/orders/database/factories/order.factory.ts",
        model: "Order",
      },
    ]);
  });

  it("writes neither section for a member without them (@covers sta-2061:FR-002)", () => {
    const { manifest } = buildManifest(COMMERCE_IR);
    expect(manifest).not.toHaveProperty("seeders");
    expect(manifest).not.toHaveProperty("factories");
  });
});

/** A package's `webhookEvents` section, which its host registers from (ADR 0308 rules 15 and 16). */
describe("buildManifest's package webhook events", () => {
  /** The section is the only place a host learns of the package's events, so it carries the full pairing. */
  it("lists each webhook event with its Integration and Connection, and no section without one", () => {
    expect(buildManifest(COURIER_PACKAGE_IR).manifest["webhookEvents"]).toEqual([
      {
        class: "CourierShipmentUpdated",
        type: "shipment.updated",
        module: "ship_courier",
        from: "@acme/ship-courier/node",
        integration: {
          key: "ship_courier.courier",
          class: "CourierIntegration",
          from: "@acme/ship-courier/node",
        },
        connection: { class: "CourierConnection", from: "@acme/ship-courier/node" },
      },
    ]);
    expect(buildManifest(LOYALTY_KIT_IR).manifest).not.toHaveProperty("webhookEvents");
  });

  /** A host refuses a hosted event its package's manifest cannot pair, rather than register it half paired. */
  it("refuses a hosted event whose Integration the package's manifest does not list", () => {
    const courier = buildManifest(COURIER_PACKAGE_IR).manifest;
    const { errors } = buildManifest({
      ...BILLING_IR,
      dependencies: [
        ...BILLING_IR.dependencies,
        { package: "@acme/ship-courier", manifest: { ...courier, integrations: [] } },
      ],
    });
    expect(errors).toContainEqual(
      expect.objectContaining({
        code: "webhook_event_unpaired",
        subject: "CourierShipmentUpdated",
      }),
    );
  });
});
