/**
 * Stackra file contract:
 * Purpose: unit tests of `buildManifest`: every derived identity (permissions with risks, event wire names with their
 *          broadcast, refusal codes with categories, action and query keys with endpoints, tools and refusals, model
 *          keys and tables, driver port keys and selectors), the module graph, the facets, the schemas without a
 *          config's schema, merged package sections marked `from`, and the checks `identity_collision`,
 *          `override_duplicate`, `permission_unknown` and `identity_missing`.
 * Boundary: test only; runs on the commerce IR fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 10, 20, 21 and 22); ADR 0305 (rules 1, 28 and
 *                     34); ADR 0140; ADR 0141.
 */
import { describe, expect, it } from "@stackra/testing";

import { MANIFEST_NOTICE } from "#core/constants/manifest-notice.constant";
import { buildManifest } from "#core/functions/build-manifest.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

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
