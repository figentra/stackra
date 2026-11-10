/**
 * Stackra file contract:
 * Purpose: unit tests of `emitWiring`: the root module, the module graph in dependency order, the platform set, each
 *          binding with its lifetime and constructor tokens (named instances through `named`), the config entry, the
 *          driver table with its selecting field and lazy candidate, the `DriverRegistry` and `PortRegistry` augmentations, replacements,
 *          partners and dependency modules marked `from`, the bindings gen adds (per-model tokens with their
 *          dependencies, an Integration's runtime, the inbound webhook route, the platform services it injects, the rules node with its revisions repository), a
 *          projection as a binding, the declared packages' driver tables of the ports the bindings reach (with
 *          their selecting config and package config rows, no registry entry; STA-1297; a candidate without the
 *          tokens of a library the member does not declare, nor in a package's own wiring of an undeclared `@stackra/*`
 *          package; no abstract driver), MediaLibrary over the media
 *          disk, a package config row only for a class its manifest's `config` section lists (STA-1308), a service's
 *          request guards and health indicator drivers from its declared packages with their config rows (a package's
 *          own row wins; none for a member that is not a service; STA-1385), a package's own default driver (memory,
 *          else its one testing driver, else its one testDefault driver), a selected port's included, no internal driver,
 *          and the names the container really exports.
 * Boundary: test only; asserts on the generated source text and on @stackra/container's exports.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 17 and 26); ADR 0263; ADR 0457; STA-1385.
 */
import { Lifetime, named } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { emitWiring } from "#core/functions/emit-wiring.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { INBOX_IR, PLAIN_IR, PRODUCER_IR } from "#core/__tests__/fixtures/cross-app-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";

const service = (deps: readonly { name: string; from: string }[]) => ({
  name: "InvoiceScanService",
  kind: "service" as const,
  module: "billing",
  file: "src/modules/billing/services/invoice-scan.service.ts",
  importPath: "#modules/billing/services/invoice-scan.service",
  options: {},
  deps: deps.map((type) => ({ class: type })),
  facets: [],
  methods: [],
  refusals: [],
  statics: {},
  traits: [],
});

const billingClass = (name: string, kind: string, extra: object = {}) => ({
  name,
  kind,
  module: "billing",
  file: `src/modules/billing/x/${name}.ts`,
  importPath: `#modules/billing/x/${name}`,
  options: {},
  deps: [],
  facets: [],
  methods: [],
  refusals: [],
  statics: {},
  traits: [],
  ...extra,
});

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
    expect(wiring).toContain("  interface PortRegistry {");
    expect(wiring).toContain('    "commerce.PaymentGateway": typeof PaymentGateway;');
    expect(wiring).not.toContain("~key");
    expect(wiring.match(/declare module /g)).toHaveLength(1);
    expect(wiring.trimEnd().endsWith("} satisfies Wiring;")).toBe(true);
  });

  it("lists no abstract driver as a candidate", () => {
    const stripe = COMMERCE_IR.classes.find(
      (declared) => declared.name === "StripePaymentGatewayDriver",
    );
    if (stripe === undefined) throw new Error("the fixture has no stripe driver");
    const content = emitWiring({
      ...COMMERCE_IR,
      classes: [
        ...COMMERCE_IR.classes,
        {
          ...stripe,
          name: "AreaPaymentGatewayDriver",
          file: "src/modules/orders/drivers/area-payment-gateway.driver.ts",
          importPath: "#modules/orders/drivers/area-payment-gateway.driver",
          abstract: true,
        },
      ],
    });
    expect(content).not.toContain("AreaPaymentGatewayDriver");
    expect(content).toContain('    "commerce.PaymentGateway": "stripe";');
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
            modules: [
              {
                key: "loyalty_kit",
                class: "LoyaltyKitModule",
                file: "src/node/loyalty-kit.module.ts",
                dependsOn: [],
              },
            ],
          },
        },
      ],
    };
    const content = emitWiring(ir);
    expect(content).toContain("    { provide: BasePolicy, override: OrderPolicy, deps: [");
    expect(content).toContain('    { class: OrderPolicy, partner: "orders.order" },');
    expect(content).toContain(
      '    loyalty_kit: { exports: [], dependsOn: [], from: "@acme/loyalty-kit", type: LoyaltyKitModule },',
    );
    expect(content).toContain('import { LoyaltyKitModule } from "@acme/loyalty-kit/node";');
  });

  it("keys a dependency module by its package when the member has a module of that key (STA-1666)", () => {
    const content = emitWiring({
      ...COMMERCE_IR,
      dependencies: [
        {
          package: "@acme/orders",
          manifest: {
            member: "orders",
            package: "@acme/orders",
            version: "0.1.0",
            modules: [
              {
                key: "orders",
                class: "OrdersKitModule",
                file: "src/node/orders.module.ts",
                dependsOn: [],
              },
            ],
          },
        },
      ],
    });
    expect(COMMERCE_IR.modules).toContain("orders");
    expect(content.match(/^ {4}orders: /gm)).toHaveLength(1);
    expect(content).toContain(
      '    "@acme/orders": { exports: [], dependsOn: [], from: "@acme/orders", type: OrdersKitModule },',
    );
  });

  it("binds a package service the member injects, from the package's manifest (STA-1686)", () => {
    const kit = buildManifest(LOYALTY_KIT_IR).manifest;
    expect(kit["services"]).toContainEqual({
      class: "LoyaltyService",
      from: "@acme/loyalty-kit",
      deps: [{ class: { name: "LoyaltyLedger", from: "@acme/loyalty-kit/contracts" } }],
    });
    const content = emitWiring({
      ...COMMERCE_IR,
      packages: [...(COMMERCE_IR.packages ?? []), "@acme/loyalty-kit"],
      classes: [
        ...COMMERCE_IR.classes,
        {
          name: "RewardsService",
          kind: "service",
          module: "orders",
          file: "src/modules/orders/services/rewards.service.ts",
          importPath: "#modules/orders/services/rewards.service",
          options: {},
          deps: [{ class: { name: "LoyaltyService", from: "@acme/loyalty-kit" } }],
          facets: [],
          methods: [],
          refusals: [],
          statics: {},
          traits: [],
        },
      ],
      dependencies: [{ package: "@acme/loyalty-kit", manifest: kit }],
    });
    expect(content).toMatch(
      /\{ module: "orders", kind: "service", provide: LoyaltyService, deps: \[LoyaltyLedger\] \},/,
    );
    expect(content).toMatch(/import \{[^}]*LoyaltyService[^}]*\} from "@acme\/loyalty-kit";/);
  });

  it("binds what the generated boot resolves for a declared package, which nothing injects (STA-2664 (n))", () => {
    const kit = buildManifest(LOYALTY_KIT_IR).manifest;
    const names = ["OutboxWriterService", "OutboxRelayService", "InboxService"];
    const outbox = {
      ...kit,
      package: "@stackra/outbox",
      services: names.map((name) => ({ class: name, from: "@stackra/outbox/node", deps: [] })),
    };
    const content = emitWiring({
      ...COMMERCE_IR,
      packages: [...(COMMERCE_IR.packages ?? []), "@stackra/outbox"],
      dependencies: [{ package: "@stackra/outbox", manifest: outbox }],
    });
    for (const name of names)
      expect(content).toMatch(new RegExp(`kind: "service", provide: ${name}, deps: \\[\\] \\},`));
  });

  it("binds FieldCipher over a declared KeyProvider for a service with encrypted fields (STA-2664 (l))", () => {
    const kit = buildManifest(LOYALTY_KIT_IR).manifest;
    const tenancy = {
      ...kit,
      package: "@stackra/tenancy",
      member: "tenancy",
      drivers: [
        {
          port: "KeyProvider",
          key: "contracts.KeyProvider",
          candidates: ["ephemeral"],
          classes: {
            ephemeral: { class: "EphemeralKeyProviderDriver", from: "@stackra/tenancy/node" },
          },
        },
      ],
    } as unknown as typeof kit;
    const encrypted = (trait: boolean) =>
      emitWiring({
        ...COMMERCE_IR,
        packages: [...(COMMERCE_IR.packages ?? []), "@stackra/tenancy"],
        classes: COMMERCE_IR.classes.map((declared) =>
          trait && declared.name === "Order"
            ? {
                ...declared,
                traits: [...declared.traits, { name: "HasEncryptedFields", args: [] }],
              }
            : declared,
        ),
        dependencies: [{ package: "@stackra/tenancy", manifest: tenancy }],
      });
    const content = encrypted(true);
    expect(content).toContain('key: "contracts.FieldCipher",');
    expect(content).toContain(
      '"aes_gcm": () => import("@stackra/contracts").then((m) => m.AesGcmFieldCipherDriver),',
    );
    expect(content).toMatch(/deps: \{ "aes_gcm": \[\w*KeyProvider\] \},/);
    expect(content).toContain('key: "contracts.KeyProvider",');
    expect(content).toContain(
      '"ephemeral": () => import("@stackra/tenancy/node").then((m) => m.EphemeralKeyProviderDriver),',
    );
    // A service without encrypted fields binds neither.
    expect(encrypted(false)).not.toContain("contracts.FieldCipher");
    expect(encrypted(false)).not.toContain("contracts.KeyProvider");
  });

  it("binds a package's extension point that its service injects, from the package's manifest", () => {
    const point = {
      name: "LoyaltyKitExtensionPoint",
      kind: "extension_point",
      module: "loyalty_kit",
      file: "src/node/extensions/loyalty-kit.extension-point.ts",
      importPath: "#node/extensions/loyalty-kit.extension-point",
      options: {},
      deps: [],
      facets: [],
      methods: [],
      refusals: [],
      statics: {},
      traits: [],
    } as const;
    const kit = buildManifest({
      ...LOYALTY_KIT_IR,
      classes: [
        ...LOYALTY_KIT_IR.classes.map((declared) =>
          declared.name === "LoyaltyService"
            ? {
                ...declared,
                deps: [
                  ...declared.deps,
                  {
                    class: {
                      name: point.name,
                      from: "#node/extensions/loyalty-kit.extension-point",
                    },
                  },
                ],
              }
            : declared,
        ),
        point,
      ],
    }).manifest;
    const services = kit["services"] as readonly { class: string; deps?: unknown[] }[];
    expect(services.find((entry) => entry.class === point.name)).toEqual({
      class: point.name,
      from: expect.stringMatching(/^@acme\/loyalty-kit/) as unknown,
    });
    const content = emitWiring({
      ...COMMERCE_IR,
      packages: [...(COMMERCE_IR.packages ?? []), "@acme/loyalty-kit"],
      classes: [
        ...COMMERCE_IR.classes,
        {
          name: "RewardsService",
          kind: "service",
          module: "orders",
          file: "src/modules/orders/services/rewards.service.ts",
          importPath: "#modules/orders/services/rewards.service",
          options: {},
          deps: [{ class: { name: "LoyaltyService", from: "@acme/loyalty-kit" } }],
          facets: [],
          methods: [],
          refusals: [],
          statics: {},
          traits: [],
        },
      ],
      dependencies: [{ package: "@acme/loyalty-kit", manifest: kit }],
    });
    expect(content).toMatch(
      /\{ module: "orders", kind: "service", provide: LoyaltyKitExtensionPoint, deps: \[\] \},/,
    );
  });

  it("binds a hosted package module's actions and raw controllers, whether or not a class injects them", () => {
    const enroll = {
      name: "EnrollMemberAction",
      kind: "action",
      module: "loyalty_kit",
      file: "src/node/actions/enroll-member.action.ts",
      importPath: "#node/actions/enroll-member.action",
      options: { key: "account.enroll" },
      deps: [{ class: { name: "LoyaltyService", from: "#core/services/loyalty.service" } }],
      facets: [],
      methods: [],
      refusals: [],
      statics: {},
      traits: [],
    } as const;
    const stream = {
      ...enroll,
      name: "PointsStreamController",
      kind: "controller",
      file: "src/node/raw/points-stream.controller.ts",
      importPath: "#node/raw/points-stream.controller",
      options: { path: "/loyalty/points/stream" },
    } as const;
    const built = buildManifest({
      ...LOYALTY_KIT_IR,
      classes: [...LOYALTY_KIT_IR.classes, enroll, stream],
    }).manifest;
    // The fixture's module is generated; a published kit names the file its module class lives in.
    const kit = {
      ...built,
      modules: (built.modules ?? []).map((entry) => ({
        ...entry,
        class: entry.class ?? "LoyaltyKitModule",
        file: entry["file"] ?? "src/node/loyalty-kit.module.ts",
      })),
    };
    const services = (kit as Record<string, unknown>)["services"] as readonly { class: string }[];
    expect(services.map((entry) => entry.class)).toContain("EnrollMemberAction");
    expect(services).toContainEqual(
      expect.objectContaining({ class: "PointsStreamController", path: "/loyalty/points/stream" }),
    );
    const content = emitWiring({
      ...COMMERCE_IR,
      packages: [...(COMMERCE_IR.packages ?? []), "@acme/loyalty-kit"],
      dependencies: [{ package: "@acme/loyalty-kit", manifest: kit }],
    });
    expect(content).toMatch(
      /\{ module: "loyalty_kit", kind: "action", provide: EnrollMemberAction, deps: \[LoyaltyService\] \},/,
    );
    expect(content).toMatch(
      /\{ module: "loyalty_kit", kind: "controller", provide: PointsStreamController, deps: \[LoyaltyService\] \},/,
    );
    // Its tokens are bound too, so the action can be built.
    expect(content).toMatch(/provide: LoyaltyService, deps: \[LoyaltyLedger\]/);
  });

  it("adds the bindings no class declares", () => {
    const billing = emitWiring(BILLING_IR);
    for (const line of [
      '    { module: "billing", kind: "integration", provide: StripeIntegration, deps: [IntegrationRuntime] },',
      '    { module: "billing", kind: "controller", provide: InboundWebhooksController, deps: [WebhookReceiver] },',
      '    { module: "billing", kind: "service", provide: IntegrationRuntime, deps: [SecretStore, RateLimitStore, Clock] },',
      '    { module: "billing", kind: "service", provide: repositoryOf(Invoice), deps: [] },',
      '    { module: "billing", kind: "service", provide: journalOf(Invoice), deps: [Locks] },',
      '    { module: "billing", kind: "service", provide: Locks, deps: [LockDriver, Clock] },',
      '    { module: "billing", kind: "service", provide: RequestContext, deps: [ContextStorage] },',
      '    { module: "billing", kind: "service", provide: WebhookReceiver, deps: [ConnectionStore, SecretStore, EventOutbox, Clock] },',
    ])
      expect(billing).toContain(line);
    expect(billing).toContain('import { InboundWebhooksController } from "#stackra/webhooks";');
    expect(billing).toContain('import { journalOf } from "@stackra/ledger/node";');
    expect(billing.match(/provide: Locks,/g)).toHaveLength(1);
  });

  it("binds the floor-aware settings reader, the resolver and the sequence allocator where they are injected", () => {
    const ir: MemberIR = {
      ...BILLING_IR,
      classes: [
        ...BILLING_IR.classes,
        {
          name: "InvoiceNumberService",
          kind: "service",
          module: "billing",
          file: "src/modules/billing/services/invoice-number.service.ts",
          importPath: "#modules/billing/services/invoice-number.service",
          options: {},
          deps: [
            { class: { name: "SequenceService", from: "@stackra/database" } },
            { class: { name: "SettingsReader", from: "@stackra/settings" } },
            { class: { name: "SettingsResolver", from: "@stackra/settings" } },
          ],
          facets: [],
          methods: [],
          refusals: [],
          statics: {},
          traits: [],
        },
      ],
    };
    const bound = emitWiring(ir);
    for (const line of [
      '    { module: "billing", kind: "service", provide: SequenceService, deps: [Database, Clock] },',
      '    { module: "billing", kind: "service", provide: SettingsReader, deps: [SettingValueStore, SettingFloorSource] },',
      '    { module: "billing", kind: "service", provide: SettingsResolver, deps: [SettingValueStore, SettingFloorSource, SettingRevisionStore, Clock] },',
    ])
      expect(bound).toContain(line);
  });

  it("binds the rules node where RuleSetService is injected, with content's revisions repository", () => {
    const ir: MemberIR = {
      ...BILLING_IR,
      classes: [
        ...BILLING_IR.classes,
        {
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
        },
      ],
    };
    const bound = emitWiring(ir);
    expect(bound).toContain('import { RuleSetService } from "@stackra/rules/node";');
    expect(bound).toContain('import { Revision } from "@stackra/content/node";');
    expect(bound).toContain(
      '    { module: "billing", kind: "service", provide: RuleSetService, deps: [repositoryOf(Revision)] },',
    );
    expect(bound).toContain(
      '    { module: "billing", kind: "service", provide: repositoryOf(Revision), deps: [] },',
    );
  });

  it("binds a Projection class like any other binding kind", () => {
    const ir: MemberIR = {
      ...BILLING_IR,
      classes: [
        ...BILLING_IR.classes,
        {
          name: "InvoiceBook",
          kind: "projection",
          module: "billing",
          file: "src/modules/billing/models/invoice-book.projection.ts",
          importPath: "#modules/billing/models/invoice-book.projection",
          options: { key: "invoice_book" },
          deps: [],
          facets: [],
          methods: [],
          refusals: [],
          statics: {},
          traits: [],
        },
      ],
    };
    expect(emitWiring(ir)).toContain(
      '    { module: "billing", kind: "projection", provide: InvoiceBook, deps: [] },',
    );
  });

  it("binds a Menu, Shortcut, Store, Bridge and ExtensionPoint, a Bridge per request (STA-2055)", () => {
    const ir = {
      ...BILLING_IR,
      classes: [
        ...BILLING_IR.classes,
        billingClass("MainMenu", "menu"),
        billingClass("SaveShortcut", "shortcut"),
        billingClass("CartStore", "store"),
        billingClass("PrintBridge", "bridge"),
        billingClass("ScanBridge", "bridge", { lifetime: "singleton" }),
        billingClass("BillingPoint", "extension_point"),
      ],
    } as MemberIR;
    const content = emitWiring(ir);
    for (const [name, kind] of [
      ["MainMenu", "menu"],
      ["SaveShortcut", "shortcut"],
      ["CartStore", "store"],
      ["BillingPoint", "extension_point"],
    ])
      expect(content).toContain(
        `    { module: "billing", kind: "${kind}", provide: ${name}, deps: [] },`,
      );
    expect(content).toContain(
      '    { module: "billing", kind: "bridge", provide: PrintBridge, lifetime: Lifetime.Request, deps: [] },',
    );
    expect(content).toContain(
      '    { module: "billing", kind: "bridge", provide: ScanBridge, lifetime: Lifetime.Singleton, deps: [] },',
    );
  });

  it("keeps a config override's base key and writes no second row (STA-2055)", () => {
    const kit = buildManifest(LOYALTY_KIT_IR).manifest;
    const emitOver = (manifest: MemberIR["dependencies"][number]["manifest"] = kit): string =>
      emitWiring({
        ...COMMERCE_IR,
        member: "web",
        classes: [
          ...COMMERCE_IR.classes.filter((candidate) => candidate.kind !== "config"),
          {
            name: "LoyaltyKitConfig",
            kind: "config",
            module: "orders",
            file: "src/config/loyalty-kit.config.ts",
            importPath: "#config/loyalty-kit.config",
            options: {
              schema: {
                $class: "WebLoyaltyOptions",
                from: "#config/web-loyalty-options.schema",
                kind: "schema",
              },
            },
            base: { name: "LoyaltyKitConfig", from: "@acme/loyalty-kit", own: false },
            deps: [],
            facets: [],
            methods: [],
            refusals: [],
            statics: {},
            traits: [],
          },
          {
            name: "RewardsService",
            kind: "service",
            module: "orders",
            file: "src/modules/orders/services/rewards.service.ts",
            importPath: "#modules/orders/services/rewards.service",
            options: {},
            deps: [
              { class: { name: "LoyaltyKitConfig", from: "@acme/loyalty-kit" } },
              { class: { name: "LoyaltyLedger", from: "@acme/loyalty-kit" } },
            ],
            facets: [],
            methods: [],
            refusals: [],
            statics: {},
            traits: [],
          },
        ],
        shapes: [
          ...COMMERCE_IR.shapes,
          {
            name: "WebLoyaltyOptions",
            kind: "schema",
            module: "orders",
            file: "src/config/web-loyalty-options.schema.ts",
            importPath: "#config/web-loyalty-options.schema",
            fields: [
              {
                name: "hostLedger",
                optional: false,
                nullable: false,
                type: { kind: "driver_name", port: "LoyaltyLedger", values: ["memory"] },
                rules: [],
              },
            ],
            relations: [],
          },
        ],
        dependencies: [{ package: "@acme/loyalty-kit", manifest }],
      });
    const content = emitOver();
    expect(content.match(/key: "loyalty_kit"/g)).toHaveLength(1);
    expect(content).not.toContain("web.loyalty_kit");
    expect(content).toMatch(
      /key: "loyalty_kit", provide: BaseLoyaltyKitConfig, override: LoyaltyKitConfig/,
    );
    // US3 scenario 2 / FR-007: the override's driver field selects under the base's key.
    expect(content).toContain('selectedBy: "config:loyalty_kit.hostLedger"');
    // EC-01: a base manifest with no `config` section derives the key from the base's member.
    expect(emitOver({ member: kit.member, package: kit.package, version: kit.version })).toMatch(
      /key: "loyalty_kit", provide: BaseLoyaltyKitConfig, override: LoyaltyKitConfig/,
    );
  });

  it("uses names @stackra/container exports", () => {
    expect(Lifetime.Request).toBe("request");
    expect(typeof named).toBe("function");
  });

  it("lists the declared packages' driver tables of the ports its bindings reach (STA-1297)", () => {
    const locking: MemberIR["dependencies"][number] = {
      package: "@stackra/locking",
      manifest: {
        member: "locking",
        package: "@stackra/locking",
        version: "0.1.0",
        drivers: [
          {
            port: "LockDriver",
            key: "locking.LockDriver",
            candidates: ["memory", "postgres"],
            selectedBy: "config:locking.driver",
            classes: {
              memory: { class: "MemoryLockDriver", from: "@stackra/locking" },
              postgres: {
                class: "PostgresLockDriver",
                from: "@stackra/locking/node",
                deps: [{ class: { name: "Database", from: "@stackra/database" } }],
              },
            },
            config: { class: "LockingConfig", from: "@stackra/locking" },
          },
          {
            port: "Unreached",
            key: "locking.Unreached",
            candidates: ["memory"],
            classes: { memory: { class: "MemoryUnreachedDriver", from: "@stackra/locking" } },
          },
        ],
      },
    };
    const content = emitWiring({
      ...BILLING_IR,
      dependencies: [...BILLING_IR.dependencies, locking],
    });
    for (const line of [
      "      port: LockDriver,",
      '      key: "locking.LockDriver",',
      '      selectedBy: "config:locking.driver",',
      '        "memory": () => import("@stackra/locking").then((m) => m.MemoryLockDriver),',
      '        "postgres": () => import("@stackra/locking/node").then((m) => m.PostgresLockDriver),',
      '      deps: { "postgres": [Database] },',
      '    { key: "locking", provide: LockingConfig },',
    ])
      expect(content).toContain(line);
    // `importLines` merges the names of one module (`import { LockingConfig, Locks } from "@stackra/locking";`).
    expect(content).toMatch(/import \{[^}]*\bLockingConfig\b[^}]*\} from "@stackra\/locking";/);
    expect(content).not.toContain("MemoryUnreachedDriver");
    expect(content).not.toContain('"locking.LockDriver": ');
  });

  it("lists no browser, React Native or Electron driver in a service, nor a port that has only those", () => {
    const identity: MemberIR["dependencies"][number] = {
      package: "@stackra/identity",
      manifest: {
        member: "identity",
        package: "@stackra/identity",
        version: "0.1.0",
        drivers: [
          {
            port: "SessionStore",
            key: "identity.SessionStore",
            candidates: ["memory", "pkce"],
            classes: {
              memory: { class: "MemorySessionStoreDriver", from: "@stackra/identity" },
              pkce: {
                class: "PkceSessionStoreDriver",
                from: "@stackra/identity",
                deps: [{ class: { name: "SignInBrowser", from: "@stackra/identity/contracts" } }],
              },
            },
          },
          {
            port: "SignInBrowser",
            key: "identity.SignInBrowser",
            candidates: ["electron", "expo"],
            classes: {
              electron: { class: "ElectronSignInBrowserDriver", from: "@stackra/identity/desktop" },
              expo: { class: "ExpoSignInBrowserDriver", from: "@stackra/identity/native" },
            },
          },
        ],
      },
    };
    const sessions: DeclaredClass = {
      name: "SignOutService",
      kind: "service",
      module: "billing",
      file: "src/modules/billing/services/sign-out.service.ts",
      importPath: "#modules/billing/services/sign-out.service",
      options: {},
      deps: [{ class: { name: "SessionStore", from: "@stackra/identity/contracts" } }],
      facets: [],
      methods: [],
      refusals: [],
      statics: {},
      traits: [],
    };
    const content = emitWiring({
      ...BILLING_IR,
      classes: [...BILLING_IR.classes, sessions],
      dependencies: [...BILLING_IR.dependencies, identity],
    });
    expect(content).toContain('      key: "identity.SessionStore",');
    expect(content).toContain(
      '        "memory": () => import("@stackra/identity").then((m) => m.MemorySessionStoreDriver),',
    );
    expect(content).not.toContain('key: "identity.SignInBrowser"');
    expect(content).not.toContain("ExpoSignInBrowserDriver");
    expect(content).not.toContain("ElectronSignInBrowserDriver");
  });

  it("lists a package candidate without the tokens of a library the member does not declare", () => {
    const database: MemberIR["dependencies"][number] = {
      package: "@stackra/database",
      manifest: {
        member: "database",
        package: "@stackra/database",
        version: "0.1.0",
        drivers: [
          {
            port: "Database",
            key: "database.Database",
            candidates: ["postgres"],
            classes: {
              postgres: {
                class: "PostgresDatabaseDriver",
                from: "@stackra/database/node",
                deps: [{ class: { name: "PostgreSqlMikroORM", from: "@mikro-orm/postgresql" } }],
              },
            },
          },
        ],
      },
    };
    const ir: MemberIR = {
      ...BILLING_IR,
      classes: [...BILLING_IR.classes, service([{ name: "Database", from: "@stackra/database" }])],
      dependencies: [...BILLING_IR.dependencies, database],
    };
    const undeclared = emitWiring(ir);
    expect(undeclared).toContain(
      '        "postgres": () => import("@stackra/database/node").then((m) => m.PostgresDatabaseDriver),',
    );
    expect(undeclared).not.toContain("@mikro-orm/postgresql");
    expect(undeclared).not.toContain('"postgres": [');
    const declared = emitWiring({
      ...ir,
      packages: [...(ir.packages ?? []), "@mikro-orm/postgresql"],
    });
    expect(declared).toContain('import { PostgreSqlMikroORM } from "@mikro-orm/postgresql";');
    expect(declared).toContain('      deps: { "postgres": [PostgreSqlMikroORM] },');
  });

  it("lists a package candidate without the tokens of a @stackra package the package does not declare, a host's with them", () => {
    const outbox: MemberIR["dependencies"][number] = {
      package: "@stackra/outbox",
      manifest: {
        member: "outbox",
        package: "@stackra/outbox",
        version: "0.1.0",
        drivers: [
          {
            port: "ChangeFeed",
            key: "outbox.ChangeFeed",
            candidates: ["memory", "postgres"],
            classes: {
              memory: { class: "MemoryChangeFeedDriver", from: "@stackra/outbox" },
              postgres: {
                class: "PostgresChangeFeedDriver",
                from: "@stackra/outbox/node",
                deps: [{ class: { name: "Database", from: "@stackra/database" } }],
              },
            },
          },
        ],
      },
    };
    const ir: MemberIR = {
      ...BILLING_IR,
      member: "data_transfer",
      package: "@stackra/data-transfer",
      layout: "package",
      packages: ["@stackra/outbox"],
      dependencies: [outbox],
      classes: [service([{ name: "ChangeFeed", from: "@stackra/outbox/contracts" }])],
    };
    const own = emitWiring(ir);
    expect(own).toContain(
      '        "postgres": () => import("@stackra/outbox/node").then((m) => m.PostgresChangeFeedDriver),',
    );
    expect(table(own, "outbox.ChangeFeed")).toContain('default: "memory",');
    expect(own).not.toContain("@stackra/database");
    expect(own).not.toContain('"postgres": [');
    // A service builds the candidate it selects, so it keeps the token and gen refuses it until it declares the package.
    expect(emitWiring({ ...ir, layout: "service" })).toContain(
      '      deps: { "postgres": [Database] },',
    );
  });

  it("binds MediaLibrary over the filesystem disk table and a media config row (STA-1297, ADR 0465)", () => {
    const media: MemberIR["dependencies"][number] = {
      package: "@stackra/media",
      manifest: {
        member: "media",
        package: "@stackra/media",
        version: "0.1.0",
        config: [{ key: "media", class: "MediaConfig", from: "@stackra/media" }],
      },
    };
    const filesystem: MemberIR["dependencies"][number] = {
      package: "@stackra/filesystem",
      manifest: {
        member: "filesystem",
        package: "@stackra/filesystem",
        version: "0.1.0",
        config: [{ key: "filesystem", class: "FilesystemConfig", from: "@stackra/filesystem" }],
        drivers: [
          {
            port: "FileSystem",
            key: "filesystem.FileSystem",
            candidates: ["memory", "s3"],
            selectedBy: "config:filesystem.disk",
            classes: {
              memory: {
                class: "MemoryFileSystemDriver",
                from: "@stackra/filesystem",
                deps: [
                  { class: { name: "FilesystemConfig", from: "@stackra/filesystem" } },
                  { class: { name: "Clock", from: "@stackra/contracts" } },
                ],
              },
              s3: {
                class: "S3FileSystemDriver",
                from: "@stackra/filesystem/node",
                deps: [{ class: { name: "FilesystemConfig", from: "@stackra/filesystem" } }],
              },
            },
            config: { class: "FilesystemConfig", from: "@stackra/filesystem" },
          },
        ],
      },
    };
    const content = emitWiring({
      ...BILLING_IR,
      classes: [
        ...BILLING_IR.classes,
        {
          name: "InvoiceScanService",
          kind: "service",
          module: "billing",
          file: "src/modules/billing/services/invoice-scan.service.ts",
          importPath: "#modules/billing/services/invoice-scan.service",
          options: {},
          deps: [{ class: { name: "MediaLibrary", from: "@stackra/media" } }],
          facets: [],
          methods: [],
          refusals: [],
          statics: {},
          traits: [],
        },
      ],
      dependencies: [...BILLING_IR.dependencies, media, filesystem],
    });
    for (const line of [
      '    { module: "billing", kind: "service", provide: MediaLibrary, deps: [FileSystem, MediaConfig, Clock] },',
      '      key: "filesystem.FileSystem",',
      '        "memory": () => import("@stackra/filesystem").then((m) => m.MemoryFileSystemDriver),',
      '      deps: { "memory": [FilesystemConfig, Clock], "s3": [FilesystemConfig] },',
      '    { key: "media", provide: MediaConfig },',
      '    { key: "filesystem", provide: FilesystemConfig },',
    ])
      expect(content).toContain(line);
    expect(content.match(/provide: MediaConfig/g)).toHaveLength(1);
    expect(content.match(/provide: FilesystemConfig/g)).toHaveLength(1);
  });

  it("writes a package config row only for a class the package's manifest lists (STA-1308)", () => {
    const search: MemberIR["dependencies"][number] = {
      package: "@stackra/search",
      manifest: {
        member: "search",
        package: "@stackra/search",
        version: "0.1.0",
        config: [{ key: "search", class: "SearchSettings", from: "@stackra/search" }],
      },
    };
    const content = emitWiring({
      ...BILLING_IR,
      classes: [
        ...BILLING_IR.classes,
        service([
          { name: "SearchSettings", from: "@stackra/search" },
          { name: "SearchIndexConfig", from: "@stackra/search" },
        ]),
      ],
      dependencies: [...BILLING_IR.dependencies, search],
    });
    expect(content).toContain('    { key: "search", provide: SearchSettings },');
    expect(content).not.toContain("provide: SearchIndexConfig }");
  });

  it("binds a service's request guards and health indicators with their config rows (STA-1385, STA-2577)", () => {
    const billing = emitWiring(BILLING_IR);
    for (const line of [
      '    { module: "billing", kind: "service", provide: EdgeHeaderGuard, deps: [EdgeSigningKeys, EdgeNonceStore] },',
      '    { module: "billing", kind: "service", provide: OriginGuard, deps: [CorsConfig, CsrfConfig] },',
      '    { module: "billing", kind: "service", provide: CsrfGuard, deps: [CsrfConfig] },',
      '    { module: "billing", kind: "service", provide: DatabaseHealthIndicatorDriver, deps: [Database, DatabaseConfig] },',
      '    { module: "billing", kind: "service", provide: QueueHealthIndicatorDriver, deps: [QueueDriver, QueueConfig] },',
      '    { module: "billing", kind: "service", provide: SearchHealthIndicatorDriver, deps: [SearchDriver, SearchConfig] },',
      '    { key: "app.edge", provide: EdgeConfig },',
      '    { key: "app.cors", provide: CorsConfig },',
      '    { key: "app.csrf", provide: CsrfConfig },',
      '    { key: "app.http", provide: HttpConfig },',
      '    { key: "database", provide: DatabaseConfig },',
      '    { key: "queue", provide: QueueConfig },',
    ])
      expect(billing).toContain(line);
    expect(billing).toMatch(/import \{[^}]*\bCorsConfig\b[^}]*\} from "@stackra\/app\/server";/);
    expect(billing).toMatch(
      /import \{[^}]*\bDatabaseHealthIndicatorDriver\b[^}]*\} from "@stackra\/database\/node";/,
    );
    expect(billing.match(/key: "app\.csrf"/g)).toHaveLength(1);
    // Packages the service does not declare bring nothing.
    expect(billing).not.toContain("CacheHealthIndicatorDriver");
    expect(billing).not.toContain("RealtimeHealthIndicatorDriver");
    expect(billing).not.toContain("FilesystemHealthIndicatorDriver");
  });

  it("binds the query cache evictor in a service that declares @stackra/cache (STA-1445)", () => {
    const cached = emitWiring({
      ...BILLING_IR,
      packages: [...(BILLING_IR.packages ?? []), "@stackra/cache"],
    });
    expect(cached).toContain(
      '    { module: "billing", kind: "service", provide: QueryCacheEvictorListener, deps: [Cache, ContextStorage] },',
    );
    expect(cached).toMatch(
      /import \{[^}]*\bQueryCacheEvictorListener\b[^}]*\} from "@stackra\/actions";/,
    );
    expect(emitWiring(BILLING_IR)).not.toContain("QueryCacheEvictorListener");
  });

  it("never binds the evictor in @stackra/actions' own wiring, nor links the cache drivers it would reach", () => {
    const action = BILLING_IR.classes.find((declared) => declared.kind === "action");
    if (action === undefined) throw new Error("the fixture has no action");
    const cache: MemberIR["dependencies"][number] = {
      package: "@stackra/cache",
      manifest: {
        member: "cache",
        package: "@stackra/cache",
        version: "0.1.0",
        drivers: [
          {
            port: "Cache",
            key: "cache.Cache",
            candidates: ["memory", "storage"],
            classes: {
              memory: { class: "MemoryCacheDriver", from: "@stackra/cache" },
              storage: {
                class: "StorageCacheDriver",
                from: "@stackra/cache",
                deps: [{ class: { name: "Storage", from: "@stackra/storage/contracts" } }],
              },
            },
          },
        ],
      },
    };
    const content = emitWiring({
      ...BILLING_IR,
      member: "actions",
      package: "@stackra/actions",
      layout: "package",
      dependencies: [cache],
      classes: [
        {
          ...action,
          name: "QueryCacheEvictorListener",
          kind: "listener",
          file: "src/core/listeners/query-cache-evictor.listener.ts",
          importPath: "#core/listeners/query-cache-evictor.listener",
          deps: [{ class: { name: "Cache", from: "@stackra/cache/contracts" } }],
        },
      ],
    });
    expect(content).not.toContain("QueryCacheEvictorListener");
    expect(content).not.toContain("@stackra/storage");
  });

  it("binds no guard or indicator outside a service (STA-1385)", () => {
    const content = emitWiring({ ...BILLING_IR, layout: "package" });
    expect(content).not.toContain("OriginGuard");
    expect(content).not.toContain("HealthIndicatorDriver");
    expect(content).not.toContain('key: "app.cors"');
  });
});

/** The lines of the driver table of `key`, up to its candidates. */
const table = (content: string, key: string): string =>
  content.slice(
    content.indexOf(`key: "${key}"`),
    content.indexOf("candidates:", content.indexOf(`key: "${key}"`)),
  );

describe("emitWiring's defaults for a package's own tests", () => {
  const memory = LOYALTY_KIT_IR.classes.find(
    (declared) => declared.name === "MemoryLoyaltyLedgerDriver",
  );
  if (memory === undefined) throw new Error("the fixture has no memory ledger driver");
  /** A driver of `port` in `folder` (`core` or `testing`), named `<name>-<port>`. */
  const driver = (name: string, port: string, folder = "core") => {
    const stem = `${name}${port}`.replaceAll(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    return {
      ...memory,
      name: `${name}${port}Driver`,
      file: `src/${folder}/drivers/${stem}.driver.ts`,
      importPath: `#${folder}/drivers/${stem}.driver`,
      partner: { name: port, kind: "port", from: `#contracts/ports/${port}.port` },
    };
  };
  const ir: MemberIR = {
    ...LOYALTY_KIT_IR,
    classes: [
      ...LOYALTY_KIT_IR.classes,
      driver("Outbox", "AuditSink"),
      driver("Recording", "AuditSink", "testing"),
      driver("Memory", "SecretVault"),
      driver("Cloud", "SecretVault"),
      driver("MarketPack", "Pricer"),
      driver("RegionMap", "Pricer"),
    ],
  };
  it("defaults a port with several candidates and no selector to memory, else its one testing driver", () => {
    const content = emitWiring(ir);
    expect(table(content, "loyalty_kit.SecretVault")).toContain('default: "memory",');
    expect(table(content, "loyalty_kit.AuditSink")).toContain('default: "recording",');
    expect(table(content, "loyalty_kit.Pricer")).not.toContain("default:");
    expect(table(content, "loyalty_kit.LoyaltyLedger")).not.toContain("default:");
  });

  it("defaults a selected port with several candidates to memory too, so config's production default does not decide", () => {
    const selected = { ...ir, classes: [...ir.classes, driver("Postgres", "LoyaltyLedger")] };
    const ledger = table(emitWiring(selected), "loyalty_kit.LoyaltyLedger");
    expect(ledger).toContain('selectedBy: "config:loyalty_kit.ledger",');
    expect(ledger).toContain('default: "memory",');
  });

  it("gives a service's wiring no default", () => {
    expect(emitWiring({ ...ir, layout: "service" })).not.toContain("default:");
  });

  it("defaults to the one driver marked testDefault when no memory or testing driver decides", () => {
    const marked = {
      ...ir,
      classes: ir.classes.map((declared) =>
        declared.name === "RegionMapPricerDriver"
          ? { ...declared, options: { ...declared.options, testDefault: true } }
          : declared,
      ),
    };
    expect(table(emitWiring(marked), "loyalty_kit.Pricer")).toContain('default: "region_map",');
  });

  it("never lists an internal driver as a candidate", () => {
    const hidden = {
      ...ir,
      classes: ir.classes.map((declared) =>
        declared.name === "CloudSecretVaultDriver"
          ? { ...declared, options: { ...declared.options, internal: true } }
          : declared,
      ),
    };
    const content = emitWiring(hidden);
    expect(content).not.toContain("CloudSecretVaultDriver");
    expect(content).not.toContain('"cloud":');
  });
});

describe("emitWiring and the cross-app relay (STA-1910)", () => {
  it("binds a consumer's inbox route over RelayInboxService and its generated inbox config", () => {
    const wiring = emitWiring(INBOX_IR);
    expect(wiring).toContain(
      '    { module: "billing", kind: "controller", provide: InboundEventsController, deps: [RelayInboxService] },',
    );
    expect(wiring).toContain(
      '    { key: "outbox.relay_inbox", provide: BaseRelayInboxConfig, override: RelayInboxConfig },',
    );
    expect(wiring).toContain(
      'import { InboundEventsController, RelayInboxConfig } from "#stackra/inbox";',
    );
    expect(wiring).toContain(
      "provide: RelayInboxService, deps: [InboxVerifier, BaseRelayInboxConfig] },",
    );
    expect(wiring).not.toContain("CrossAppFanOut");
  });

  it("binds a producer's fan-out, relay, generated relay config and the Postgres deliveries", () => {
    const wiring = emitWiring(PRODUCER_IR);
    expect(wiring).toContain(
      '    { key: "outbox.events_relay", provide: BaseEventsRelayConfig, override: EventsRelayConfig },',
    );
    expect(wiring).toContain(
      "provide: CrossAppFanOut, deps: [SubscriberSource, DeliveryDriver] },",
    );
    expect(wiring).toContain(
      "provide: CrossAppRelayService, deps: [DeliveryDriver, SubscriberSource, EventSigner] },",
    );
    expect(wiring).toMatch(/key: "outbox\.DeliveryDriver",\n {6}default: "postgres",/);
    expect(wiring).not.toContain("InboundEventsController");
  });

  it("adds nothing for a service with neither", () => {
    const wiring = emitWiring(PLAIN_IR);
    expect(wiring).not.toMatch(/CrossApp|RelayInbox|EventsRelayConfig|default: "postgres"/);
  });
});
