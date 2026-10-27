/**
 * Stackra file contract:
 * Purpose: integration-style unit tests of `discoverMember` (and through it `createSourceReader`) on a real fixture
 *          package: kinds from bare, called and value-argument bases, options as constants, partners, constructor
 *          tokens with a named instance, the lifetime, facets, public methods, `handle` shapes, refusals, statics,
 *          shapes with rules, defaults, enums, dates and driver names, enums in source order, file exports, the
 *          authored root module, the dependency package names, and tests read only when asked; on both TypeScript
 *          backends with equal results; the consumed services that exist beside the member (`workspaceServices`); and
 *          the declared packages' lang catalogues and the `I18n` keys the member uses (STA-1298).
 * Boundary: test only; writes the fixture under `.cache/` and opens TypeScript on it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 16, 17, 20, 25 and 26); ADR 0305 (rules 42 and
 *                     45).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { discoverMember } from "#node/functions/discover-member.function";
import { SHOP_SOURCES } from "#node/__tests__/fixtures/shop-sources.fixture";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

describe("discoverMember", async () => {
  const root = writeFixtureMember("shop", SHOP_SOURCES);
  const ir = await discoverMember(root);
  const declared = (name: string) => ir.classes.find((candidate) => candidate.name === name);
  const shape = (name: string) => ir.shapes.find((candidate) => candidate.name === name);

  it("reads the member's facts", () => {
    expect(ir).toMatchObject({
      member: "shop",
      package: "@fixture/shop",
      version: "1.0.0",
      layout: "package",
      modules: ["shop"],
      // The fixture's package.json declares what the generated files import (STA-1296), plus the shop's own.
      packages: [
        "@stackra/actions",
        "@stackra/app",
        "@stackra/clients",
        "@stackra/config",
        "@stackra/container",
        "@stackra/contracts",
        "@stackra/errors",
        "@stackra/events",
        "@stackra/locking",
        "@stackra/money",
        "@stackra/outbox",
        "@stackra/queue",
        "@stackra/scheduler",
        "@stackra/settings",
        "@stackra/testing",
        "@stackra/tsdown-config",
        "@stackra/validation",
        "@stackra/vitest-config",
      ],
    });
    expect(ir.rootModule).toEqual({ name: "ShopModule", from: "#node/shop.module" });
    expect(ir.errors).toEqual([]);
  });

  it("reads each class's kind and options", () => {
    expect(declared("PaymentGateway")?.kind).toBe("port");
    expect(declared("ShopConfig")).toMatchObject({
      kind: "config",
      options: {
        schema: {
          $class: "ShopOptions",
          from: "#core/schemas/shop-options.schema",
          kind: "schema",
        },
        env: { gateway: "STACKRA_SHOP_GATEWAY" },
      },
    });
    expect(declared("CancelOrderAction")).toMatchObject({
      kind: "action",
      options: { key: "order.cancel", actors: ["user"] },
    });
    expect(declared("OrderNotCancellableError")).toMatchObject({
      kind: "refusal",
      options: { kind: "failed_precondition" },
    });
    expect(declared("OrderPaid")).toMatchObject({
      kind: "integration_event",
      options: { name: "order.paid" },
    });
    expect(declared("OrderPermissions")).toMatchObject({
      kind: "permissions",
      statics: { read: "Permission.L0", cancel: "Permission.L2" },
    });
    expect(declared("ShopModule")).toMatchObject({
      kind: "module",
      options: { exports: [{ $class: "ShopService", from: "#core/services/shop.service" }] },
    });
  });

  it("reads partners, tokens, lifetimes, facets and methods", () => {
    expect(declared("StripePaymentGatewayDriver")).toMatchObject({
      kind: "driver",
      partner: {
        name: "PaymentGateway",
        kind: "port",
        from: "#contracts/ports/payment-gateway.port",
      },
      deps: [{ class: { name: "ShopConfig", from: "#config/shop.config" } }],
    });
    const service = declared("ShopService");
    expect(service?.deps).toEqual([
      { class: { name: "Clock", from: "@stackra/contracts" } },
      { class: { name: "PaymentGateway", from: "#contracts/ports/payment-gateway.port" } },
      {
        class: { name: "PaymentGateway", from: "#contracts/ports/payment-gateway.port" },
        named: "fallback",
      },
    ]);
    expect(service?.lifetime).toBe("request");
    expect(service?.methods).toEqual(["cancel", "list"]);
    expect(service?.facets).toContainEqual({
      name: "Audited",
      kind: "audited",
      target: "class",
      options: { reason: "money" },
      from: "#core/functions/audited.function",
    });
    expect(service?.refusals).toEqual(["order_not_cancellable"]);
  });

  it("reads `handle` and the refusals a body raises", () => {
    expect(declared("CancelOrderAction")).toMatchObject({
      handle: { input: "CancelOrderInput", output: "CancelOrderOutput" },
      refusals: ["order_not_cancellable"],
      deps: [{ class: { name: "ShopService", from: "#core/services/shop.service" } }],
    });
  });

  it("reads shapes with rules, defaults and their types", () => {
    expect(shape("CancelOrderInput")?.fields).toEqual([
      {
        name: "orderId",
        optional: false,
        nullable: false,
        type: { kind: "public_id", prefix: "ord" },
        rules: [],
      },
      {
        name: "reason",
        optional: true,
        nullable: false,
        type: { kind: "string" },
        rules: [
          { name: "Trim", options: {} },
          { name: "Str", options: { max: 200 } },
        ],
      },
      {
        name: "attempts",
        optional: false,
        nullable: false,
        type: { kind: "number" },
        rules: [{ name: "Int", options: { min: 1, max: 5 } }],
        default: { value: 1, code: "1", imports: [] },
      },
    ]);
    expect(shape("CancelOrderOutput")?.fields).toEqual([
      {
        name: "status",
        optional: false,
        nullable: false,
        type: {
          kind: "enum",
          name: "OrderStatus",
          values: ["pending", "paid", "cancelled"],
          module: "shop",
        },
        rules: [],
        default: { value: "cancelled", code: '"cancelled"', imports: [] },
      },
      { name: "cancelledAt", optional: false, nullable: true, type: { kind: "date" }, rules: [] },
    ]);
    expect(shape("ShopOptions")?.fields[0]?.type).toEqual({
      kind: "driver_name",
      port: "PaymentGateway",
      values: ["stripe"],
    });
    expect(shape("OrderPaid")?.kind).toBe("integration_event");
  });

  it("reads enums and file exports", () => {
    expect(ir.enums).toEqual([
      {
        name: "OrderStatus",
        module: "shop",
        file: "src/contracts/enums/order-status.enum.ts",
        values: ["pending", "paid", "cancelled"],
      },
    ]);
    expect(
      ir.files.find((file) => file.file === "src/contracts/enums/order-status.enum.ts"),
    ).toEqual({
      file: "src/contracts/enums/order-status.enum.ts",
      importPath: "#contracts/enums/order-status.enum",
      folder: "contracts",
      names: [{ name: "OrderStatus", typeOnly: false }],
    });
    expect(ir.files.map((file) => file.file)).not.toContain("src/node/__tests__/fixture.module.ts");
  });

  it("reads test files when asked and agrees on both backends", async () => {
    const withTests = await discoverMember(root, { includeTests: true });
    expect(withTests.classes.map((candidate) => candidate.name)).toContain("FixtureModule");
    const six = await discoverMember(root, { backend: "ts6" });
    expect(JSON.stringify(six)).toBe(JSON.stringify(ir));
  });
});

describe("discoverMember workspace services", () => {
  it("lists the consumed services with a folder beside the member, manifest or not", async () => {
    const root = writeFixtureMember("channels", {
      "src/core/services/sync.service.ts": [
        'import { Service } from "@stackra/container";',
        'import type { CatalogueClient } from "#stackra/clients/catalogue";',
        'import type { StockClient } from "#stackra/clients/stock";',
        "export class SyncService extends Service {",
        "  constructor(",
        "    private readonly catalogue: CatalogueClient,",
        "    private readonly stock: StockClient,",
        "  ) {",
        "    super();",
        "  }",
        "}",
        "",
      ].join("\n"),
    });
    mkdirSync(join(dirname(root), "catalogue"), { recursive: true });
    writeFileSync(join(dirname(root), "catalogue", "package.json"), "{}");
    const ir = await discoverMember(root);
    expect(ir.workspaceServices).toEqual(["catalogue"]);
    expect(ir.services).toBeUndefined();
  });
});

describe("discoverMember i18n (STA-1298)", () => {
  it("reads the declared packages' lang and the I18n keys the member's files use", async () => {
    const root = writeFixtureMember("customers", {
      "node_modules/@stackra/loyalty-kit/package.json": JSON.stringify({
        name: "@stackra/loyalty-kit",
      }),
      "node_modules/@stackra/loyalty-kit/assets/lang/en/loyalty_kit.json": JSON.stringify({
        enums: { loyalty_tier: { gold: "Gold" } },
      }),
      "package.json": JSON.stringify({
        name: "@fixture/customers",
        version: "1.0.0",
        type: "module",
        dependencies: { "@stackra/loyalty-kit": "workspace:*" },
      }),
      "src/core/labels.ts":
        'import { I18n } from "#stackra/i18n";\nexport const gold = I18n.loyalty_kit.enums.loyalty_tier.gold;\n',
    });
    const ir = await discoverMember(root);
    expect(ir.packageCatalogues?.map((shipped) => shipped.package)).toEqual([
      "@stackra/loyalty-kit",
    ]);
    expect(ir.i18nReferences?.map((reference) => reference.path)).toEqual([
      ["loyalty_kit", "enums", "loyalty_tier", "gold"],
    ]);
  });

  it("leaves a devDependency's lang out: it never reaches the runtime (STA-1309)", async () => {
    const root = writeFixtureMember("customers-dev", {
      "node_modules/@stackra/loyalty-kit/package.json": JSON.stringify({
        name: "@stackra/loyalty-kit",
      }),
      "node_modules/@stackra/loyalty-kit/assets/lang/en/loyalty_kit.json": JSON.stringify({
        title: "Loyalty",
      }),
      "package.json": JSON.stringify({
        name: "@fixture/customers-dev",
        version: "1.0.0",
        type: "module",
        devDependencies: { "@stackra/loyalty-kit": "workspace:*" },
      }),
    });
    const ir = await discoverMember(root);
    expect(ir.packageCatalogues).toBeUndefined();
  });
});
