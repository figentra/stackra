/**
 * Stackra file contract:
 * Purpose: unit tests of `CatalogueManifest` and its shipped schema: a valid manifest parses into an instance with the
 *          four sections defaulted, open fields and other sections pass through, and each broken rule fails at its
 *          path.
 * Boundary: test only; validates through @stackra/validation, as a registry service does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";
import { schemaOf, validate } from "@stackra/validation";

import { CATALOGUE_MANIFEST_SCHEMA } from "#core/constants/catalogue-manifest-schema.constant";
import { CatalogueManifest } from "#core/schemas/catalogue-manifest.schema";

const HEADER = { member: "commerce", package: "@figentra/service-commerce", version: "1" };

/** The issue paths of a failed parse, dotted. */
const failedPaths = (raw: unknown): string[] => {
  const result = validate(CatalogueManifest, raw);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
};

describe("CatalogueManifest", () => {
  it("registers the shipped schema for itself", () => {
    expect(schemaOf(CatalogueManifest)).toBe(CATALOGUE_MANIFEST_SCHEMA);
  });

  it("parses a header-only manifest into an instance with empty sections", () => {
    const result = validate(CatalogueManifest, HEADER);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toBeInstanceOf(CatalogueManifest);
    expect(result.data.modules).toEqual([]);
    expect(result.data.actions).toEqual([]);
    expect(result.data.events).toEqual([]);
    expect(result.data.permissions).toEqual([]);
  });

  it("keeps open fields and the sections it does not check", () => {
    const result = validate(CatalogueManifest, {
      ...HEADER,
      ui: { widgets: [] },
      modules: [{ key: "orders", dependsOn: [], tables: ["orders.orders"] }],
      actions: [
        {
          key: "orders.order.cancel@1",
          kind: "action",
          module: "orders",
          class: "CancelOrderAction",
          permission: "orders.order.cancel",
          risk: "L2",
          actors: ["user", "agent"],
          route: "PUT /orders/:orderId/cancel",
        },
      ],
      events: [
        { name: "orders.order.paid.v1", module: "orders", class: "OrderPaid", kind: "integration" },
      ],
      permissions: [{ key: "orders.order.cancel", risk: "L2", label: "Cancel an order" }],
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect((result.data as unknown as { ui: unknown }).ui).toEqual({ widgets: [] });
    expect(result.data.modules[0]?.["tables"]).toEqual(["orders.orders"]);
    expect(result.data.actions[0]?.["route"]).toBe("PUT /orders/:orderId/cancel");
    expect(result.data.permissions[0]?.["label"]).toBe("Cancel an order");
  });

  it("reads the catalogue fields: intents, entitlement, tool and the webhook event row", () => {
    const result = validate(CatalogueManifest, {
      ...HEADER,
      modules: [
        {
          key: "orders",
          dependsOn: [],
          enhances: ["loyalty"],
          intents: ["order.track"],
          entitlement: "orders.module",
        },
      ],
      actions: [
        {
          key: "orders.order.cancel@1",
          kind: "action",
          module: "orders",
          class: "CancelOrderAction",
          permission: "orders.order.cancel",
          risk: "L2",
          tool: { name: "orders_order_cancel", default: true, hints: {} },
        },
        {
          key: "orders.order.refund@1",
          kind: "action",
          module: "orders",
          class: "RefundOrderAction",
          permission: "orders.order.refund",
          risk: "L3",
          tool: true,
        },
      ],
      events: [
        {
          name: "orders.order.paid.v1",
          module: "orders",
          class: "OrderPaid",
          kind: "integration",
          webhook: true,
          dataClasses: ["personal"],
          thinFields: ["total"],
        },
      ],
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.modules[0]?.intents).toEqual(["order.track"]);
    expect(result.data.modules[0]?.entitlement).toBe("orders.module");
    expect(result.data.actions[1]?.tool).toBe(true);
    expect(result.data.events[0]?.dataClasses).toEqual(["personal"]);
  });

  it("fails a broken catalogue field at its path", () => {
    expect(
      failedPaths({ ...HEADER, modules: [{ key: "orders", dependsOn: [], entitlement: "" }] }),
    ).toEqual(["modules.0.entitlement"]);
    expect(
      failedPaths({
        ...HEADER,
        events: [
          {
            name: "orders.order.paid.v1",
            module: "orders",
            class: "OrderPaid",
            kind: "integration",
            webhook: "yes",
            dataClasses: ["secret"],
          },
        ],
      }),
    ).toEqual(["events.0.webhook", "events.0.dataClasses.0"]);
  });

  it("builds an instance from code with create", () => {
    const manifest = CatalogueManifest.create({
      ...HEADER,
      modules: [{ key: "orders", dependsOn: [] }],
      actions: [],
      events: [],
      permissions: [],
    });
    expect(manifest).toBeInstanceOf(CatalogueManifest);
    expect(manifest.modules).toHaveLength(1);
  });

  it("fails each broken rule at its path", () => {
    expect(failedPaths({ ...HEADER, member: "Commerce" })).toEqual(["member"]);
    expect(failedPaths({ ...HEADER, package: "" })).toEqual(["package"]);
    expect(failedPaths({ member: "commerce", package: "x" })).toEqual(["version"]);
    expect(failedPaths({ ...HEADER, modules: [{ key: "orders" }] })).toEqual([
      "modules.0.dependsOn",
    ]);
    expect(
      failedPaths({ ...HEADER, modules: [{ key: "orders", dependsOn: ["Billing"] }] }),
    ).toEqual(["modules.0.dependsOn.0"]);
    expect(
      failedPaths({
        ...HEADER,
        actions: [
          {
            key: "orders.order.cancel@1",
            kind: "command",
            module: "orders",
            class: "CancelOrderAction",
            permission: "orders.order.cancel",
            risk: "L7",
          },
        ],
      }),
    ).toEqual(["actions.0.kind", "actions.0.risk"]);
    expect(
      failedPaths({
        ...HEADER,
        events: [
          {
            name: "orders.order.paid.v1",
            module: "orders",
            class: "OrderPaid",
            kind: "integration",
            version: 0,
          },
        ],
      }),
    ).toEqual(["events.0.version"]);
    expect(failedPaths({ ...HEADER, permissions: [{ key: "orders.order.cancel" }] })).toEqual([
      "permissions.0.risk",
    ]);
    expect(failedPaths("not a manifest")).toEqual([""]);
  });
});
