/**
 * Stackra file contract:
 * Purpose: unit tests of `validateCatalogue`: a valid catalogue gives no diagnostics; each check reports its code at
 *          the right member and path; a malformed or duplicate manifest is not checked further; the output never
 *          depends on the order of the input.
 * Boundary: test only; builds plain manifest objects as CI would publish them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0109; ADR 0214.
 */
import { describe, expect, it } from "@stackra/testing";

import { validateCatalogue } from "#core/functions/validate-catalogue.function";

/** A manifest of `member` with `modules` (key to dependencies) and optional extra sections. */
const manifest = (
  member: string,
  modules: Readonly<Record<string, readonly string[]>>,
  sections: Readonly<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  member,
  package: `@figentra/service-${member}`,
  version: "1",
  modules: Object.entries(modules).map(([key, dependsOn]) => ({ key, dependsOn })),
  ...sections,
});

/** An action entry of `module` with `key`. */
const action = (module: string, key: string): Record<string, unknown> => ({
  key,
  kind: "action",
  module,
  class: "CancelOrderAction",
  permission: `${module}.order.cancel`,
  risk: "L2",
});

/** An event entry of `module` with `name`. */
const event = (module: string, name: string): Record<string, unknown> => ({
  name,
  module,
  class: "OrderPaid",
  kind: "integration",
});

const COMMERCE = manifest(
  "commerce",
  { orders: ["billing"], catalogue: [] },
  {
    actions: [action("orders", "orders.order.cancel@1")],
    events: [event("orders", "orders.order.paid.v1")],
    permissions: [{ key: "orders.order.cancel", risk: "L2" }],
  },
);
const BILLING = manifest("billing", { billing: [] });

describe("validateCatalogue", () => {
  it("returns no diagnostics for a valid catalogue", () => {
    expect(validateCatalogue([COMMERCE, BILLING])).toEqual([]);
    expect(validateCatalogue([])).toEqual([]);
  });

  it("reports each shape issue of a malformed manifest and checks it no further", () => {
    expect(
      validateCatalogue([
        {
          member: "Commerce",
          package: "@figentra/service-commerce",
          version: "1",
          modules: [{ key: "orders" }],
        },
        42,
      ]),
    ).toEqual([
      expect.objectContaining({ code: "manifest_invalid", member: "", path: "" }),
      expect.objectContaining({ code: "manifest_invalid", member: "Commerce", path: "member" }),
      expect.objectContaining({
        code: "manifest_invalid",
        member: "Commerce",
        path: "modules[0].dependsOn",
      }),
    ]);
  });

  it("reports a repeated member on the later publisher only", () => {
    const again = {
      ...manifest("billing", { invoices: ["nowhere"] }),
      package: "@figentra/service-zbilling",
    };
    expect(validateCatalogue([again, BILLING])).toEqual([
      {
        code: "duplicate_member",
        member: "billing",
        path: "",
        message:
          'member "billing" of @figentra/service-zbilling is already published by @figentra/service-billing',
      },
    ]);
  });

  it("reports an identity declared twice on the later declaration, naming the first owner", () => {
    const shop = manifest(
      "shop",
      { orders: [], storefront: [] },
      {
        actions: [action("orders", "orders.order.cancel@1")],
        events: [event("orders", "orders.order.paid.v1")],
        permissions: [{ key: "orders.order.cancel", risk: "L2" }],
      },
    );
    expect(validateCatalogue([shop, COMMERCE, BILLING])).toEqual([
      {
        code: "identity_collision",
        member: "shop",
        path: "actions[0].key",
        message: 'action "orders.order.cancel@1" is already declared by commerce at actions[0].key',
      },
      {
        code: "identity_collision",
        member: "shop",
        path: "events[0].name",
        message: 'event "orders.order.paid.v1" is already declared by commerce at events[0].name',
      },
      {
        code: "identity_collision",
        member: "shop",
        path: "modules[0].key",
        message: 'module "orders" is already declared by commerce at modules[0].key',
      },
      {
        code: "identity_collision",
        member: "shop",
        path: "permissions[0].key",
        message:
          'permission "orders.order.cancel" is already declared by commerce at permissions[0].key',
      },
    ]);
  });

  it("reports an action or event that names a module its member does not declare", () => {
    const catalogue = manifest(
      "catalogue",
      { products: [] },
      {
        actions: [action("orders", "orders.order.cancel@1")],
        events: [event("orders", "orders.order.paid.v1")],
      },
    );
    expect(validateCatalogue([catalogue])).toEqual([
      {
        code: "unknown_module",
        member: "catalogue",
        path: "actions[0].module",
        message:
          'action "orders.order.cancel@1" names module "orders", which catalogue does not declare',
      },
      {
        code: "unknown_module",
        member: "catalogue",
        path: "events[0].module",
        message:
          'event "orders.order.paid.v1" names module "orders", which catalogue does not declare',
      },
    ]);
  });

  it("reports an identity outside its module's namespace", () => {
    const shop = manifest(
      "shop",
      { orders: [] },
      {
        actions: [action("orders", "order.cancel@1"), action("orders", "orders.")],
        events: [event("orders", "ordersx.order.paid.v1")],
        permissions: [{ key: "billing.invoice.void", risk: "L3" }],
      },
    );
    expect(validateCatalogue([shop]).map(({ code, path }) => [code, path])).toEqual([
      ["foreign_namespace", "actions[0].key"],
      ["foreign_namespace", "actions[1].key"],
      ["foreign_namespace", "events[0].name"],
      ["foreign_namespace", "permissions[0].key"],
    ]);
  });

  it("reports a dependency no manifest declares", () => {
    expect(validateCatalogue([COMMERCE])).toEqual([
      {
        code: "unknown_dependency",
        member: "commerce",
        path: "modules[0].dependsOn[0]",
        message: 'module "orders" depends on "billing", which no manifest declares',
      },
    ]);
  });

  it("reports each loop once, on its smallest module key, across members", () => {
    const ring = manifest("ring", { gamma: ["alpha"], beta: ["gamma"], solo: ["solo"] });
    const head = manifest("head", { alpha: ["beta"], tail: ["alpha"] });
    expect(validateCatalogue([ring, head])).toEqual([
      {
        code: "dependency_cycle",
        member: "head",
        path: "modules[0].dependsOn",
        message: 'modules "alpha", "beta", "gamma" depend on each other in a loop',
      },
      {
        code: "dependency_cycle",
        member: "ring",
        path: "modules[2].dependsOn",
        message: 'module "solo" depends on itself',
      },
    ]);
  });

  it("gives the same output for the same manifests in any order", () => {
    const shop = manifest(
      "shop",
      { orders: ["missing"], loop: ["loop"] },
      { actions: [action("orders", "orders.order.cancel@1")] },
    );
    const broken = { member: "broken", package: "x" };
    const forward = validateCatalogue([COMMERCE, BILLING, shop, broken]);
    expect(forward.length).toBeGreaterThan(0);
    expect(validateCatalogue([broken, shop, BILLING, COMMERCE])).toEqual(forward);
    expect(validateCatalogue([shop, broken, COMMERCE, BILLING])).toEqual(forward);
  });
});
