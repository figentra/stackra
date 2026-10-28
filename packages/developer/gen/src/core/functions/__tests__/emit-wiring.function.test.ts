/**
 * Stackra file contract:
 * Purpose: unit tests of `emitWiring`: the root module, the module graph in dependency order, the platform set, each
 *          binding with its lifetime and constructor tokens (named instances through `named`), the config entry, the
 *          driver table with its selecting field and lazy candidate, the `DriverRegistry` augmentation, replacements,
 *          partners and dependency modules marked `from`, the bindings gen adds (per-model tokens with their
 *          dependencies, an Integration's runtime, the inbound webhook route, the platform services it injects, the rules node with its revisions repository), a
 *          projection as a binding, the declared packages' driver tables of the ports the bindings reach (with
 *          their selecting config and package config rows, no registry entry; STA-1297), MediaLibrary over the media
 *          disk, a package config row only for a class its manifest's `config` section lists (STA-1308), and the
 *          names the container really exports.
 * Boundary: test only; asserts on the generated source text and on @stackra/container's exports.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 17 and 26); ADR 0263.
 */
import { Lifetime, named } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { emitWiring } from "#core/functions/emit-wiring.function";
import type { MemberIR } from "#core/types/member-ir.type";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
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
});
