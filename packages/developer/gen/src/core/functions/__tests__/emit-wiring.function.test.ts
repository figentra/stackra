/**
 * Stackra file contract:
 * Purpose: unit tests of `emitWiring`: the root module, the module graph in dependency order, the platform set, each
 *          binding with its lifetime and constructor tokens (named instances through `named`), the config entry, the
 *          driver table with its selecting field and lazy candidate, the `DriverRegistry` augmentation, replacements,
 *          partners and dependency modules marked `from`, and the names the container really exports.
 * Boundary: test only; asserts on the generated source text and on @stackra/container's exports.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 17 and 26); ADR 0263.
 */
import { Lifetime, named } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { emitWiring } from "#core/functions/emit-wiring.function";
import type { MemberIR } from "#core/types/member-ir.type";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

describe("emitWiring", () => {
  const wiring = emitWiring(COMMERCE_IR);

  it("prints the root and the module graph in dependency order", () => {
    expect(wiring).toContain('import { CommerceModule } from "#stackra/module";');
    expect(wiring).toContain("  root: CommerceModule,");
    expect(wiring).toContain("    commerce: { exports: [], dependsOn: [], type: CommerceModule },");
    expect(wiring).toContain('    orders: { exports: [], dependsOn: ["commerce"] },');
    expect(wiring.indexOf("    commerce:")).toBeLessThan(wiring.indexOf("    orders:"));
  });

  it("prints the bindings, the platform set and the named tokens", () => {
    expect(wiring).toContain("  platform: [Clock],");
    expect(wiring).toContain(
      '    { module: "orders", kind: "action", provide: CancelOrderAction, deps: [OrderService] },',
    );
    expect(wiring).toContain(
      '    { module: "orders", kind: "service", provide: OrderService, lifetime: Lifetime.Request, deps: [Clock, PaymentGateway, named(PaymentGateway, "fallback")] },',
    );
    expect(wiring).not.toContain('kind: "permissions"');
    expect(wiring).toContain('import { Lifetime, named, type Wiring } from "@stackra/container";');
  });

  it("prints the config, the drivers and the registry", () => {
    expect(wiring).toContain(
      '    { key: "commerce", provide: CommerceConfig, schema: CommerceOptions, env: {"gateway":"STACKRA_PAYMENT_GATEWAY"} },',
    );
    expect(wiring).toContain('      key: "commerce.PaymentGateway",');
    expect(wiring).toContain('      selectedBy: "config:commerce.gateway",');
    expect(wiring).toContain(
      '        "stripe": () => import("#modules/orders/drivers/stripe-payment-gateway.driver").then((m) => m.StripePaymentGatewayDriver),',
    );
    expect(wiring).toContain('      deps: { "stripe": [CommerceConfig] },');
    expect(wiring).toContain('    "commerce.PaymentGateway": "stripe";');
    expect(wiring.trimEnd().endsWith("} satisfies Wiring;")).toBe(true);
  });

  it("prints replacements, partners and dependency modules", () => {
    const ir: MemberIR = {
      ...COMMERCE_IR,
      classes: [
        ...COMMERCE_IR.classes,
        {
          name: "OrderPolicy",
          kind: "policy",
          module: "orders",
          file: "src/modules/orders/access/order.policy.ts",
          importPath: "#modules/orders/access/order.policy",
          options: {},
          partner: { name: "Order", kind: "model", from: "#modules/orders/models/order.model" },
          deps: [],
          facets: [
            {
              name: "Replaces",
              kind: "replaces",
              target: "class",
              options: { $class: "BasePolicy", from: "@acme/kit" },
              from: "@stackra/container",
            },
          ],
          methods: [],
          refusals: [],
          statics: {},
          traits: [],
        },
      ],
      dependencies: [
        {
          package: "@acme/loyalty-kit",
          manifest: {
            member: "loyalty_kit",
            package: "@acme/loyalty-kit",
            version: "0.4.0",
            modules: [{ key: "loyalty_kit", class: "LoyaltyKitModule", dependsOn: [] }],
          },
        },
      ],
    };
    const content = emitWiring(ir);
    expect(content).toContain("    { provide: BasePolicy, override: OrderPolicy },");
    expect(content).toContain('    { class: OrderPolicy, partner: "orders.order" },');
    expect(content).toContain(
      '    loyalty_kit: { exports: [], dependsOn: [], from: "@acme/loyalty-kit", type: LoyaltyKitModule },',
    );
    expect(content).toContain('import { LoyaltyKitModule } from "@acme/loyalty-kit/node";');
  });

  it("uses names @stackra/container exports", () => {
    expect(Lifetime.Request).toBe("request");
    expect(typeof named).toBe("function");
  });
});
