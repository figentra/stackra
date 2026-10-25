/**
 * Stackra file contract:
 * Purpose: unit tests of `buildManifest`: every derived identity (permissions with risks, event wire names with their
 *          broadcast, refusal codes with categories, action and query keys with endpoints, tools and refusals, model
 *          keys and tables, driver port keys and selectors, integration keys with their connection and webhook path,
 *          sequence keys, an app's block and route keys), the module graph, the facets, the schemas without a
 *          config's schema, merged package sections marked `from`, and the checks `identity_collision`,
 *          `override_duplicate`, `permission_unknown`, `identity_missing`, `prefix_invalid`, `prefix_taken` and
 *          `prefix_duplicate`.
 * Boundary: test only; runs on the commerce IR fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 10, 20, 21 and 22); ADR 0305 (rules 1, 28 and
 *                     34); ADR 0140; ADR 0141; ADR 0135 (rule 2); ADR 0308 (rule 19); ADR 0342 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { MANIFEST_NOTICE } from "#core/constants/manifest-notice.constant";
import { buildManifest } from "#core/functions/build-manifest.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

/** The fixture class named `name`. */
function declared(name: string): DeclaredClass {
  const found = COMMERCE_IR.classes.find((candidate) => candidate.name === name);
  if (found === undefined) throw new Error(`no fixture class ${name}`);
  return found;
}

describe("buildManifest", () => {
  const { manifest, errors } = buildManifest(COMMERCE_IR);

  it("derives the header, permissions and events", () => {
    expect(errors).toEqual([]);
    expect(manifest.$comment).toBe(MANIFEST_NOTICE);
    expect(manifest.member).toBe("commerce");
    expect(manifest.permissions).toEqual([
      { key: "orders.order.read", risk: "L0" },
      { key: "orders.order.create", risk: "L1" },
      { key: "orders.order.cancel", risk: "L2" },
    ]);
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
      idempotency: { ttl: "PT24H" },
      endpoint: { method: "PUT", path: "/orders/:orderId/cancel", derived: true },
      input: { $ref: "#/schemas/orders.CancelOrderInput" },
      output: { $ref: "#/schemas/orders.CancelOrderOutput" },
      refusals: ["order_not_cancellable"],
    });
    expect(cancel?.["tool"]).toBeUndefined();
    expect(list).toMatchObject({
      key: "orders.order.list@1",
      permission: "orders.order.read",
      risk: "L0",
      endpoint: { method: "GET", path: "/orders" },
      tool: { name: "orders_order_list", default: true },
    });
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
            permissions: [{ key: "loyalty_kit.loyalty_account.redeem", risk: "L1" }],
            actions: [
              {
                key: "loyalty_kit.loyalty_account.redeem@1",
                kind: "action",
                module: "loyalty_kit",
                class: "RedeemPointsAction",
                permission: "loyalty_kit.loyalty_account.redeem",
                risk: "L1",
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
});
