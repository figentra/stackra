/**
 * Stackra file contract:
 * Purpose: unit tests of `emitRuntimeEntries`: a service gets `server`, which loads its registrations when they are
 *          written and hands `createApp` its boot when gen writes one; an app gets `browser` (web, PWA, desktop renderer) and `native` (iOS, Android), each in the form
 *          its `createApp` takes and loading the route table and blocks this run writes, the native one of a
 *          web-and-native app on `nativeWiring`; a package and a worker get none; a service with seeders and a boot
 *          gets `seed` (STA-1709), which registers factory pairs and runs hosted package seeders
 *          first, in module order (STA-2061).
 * Boundary: test only; runs on the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0295 (decisions 7 to 9).
 */
import { describe, expect, it } from "@stackra/testing";

import { emitRuntimeEntries } from "#core/functions/emit-runtime-entries.function";
import type { MemberIR } from "#core/types/member-ir.type";
import type { DeclaredClass } from "#core/types/declared-class.type";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";

/** A seeder of the orders module for `profile`. */
function seeder(name: string, profile: string): DeclaredClass {
  return {
    name,
    kind: "seeder",
    module: "orders",
    file: `src/modules/orders/database/seeders/${profile}.seeder.ts`,
    importPath: `#modules/orders/database/seeders/${profile}.seeder`,
    options: {},
    deps: [],
    facets: [],
    methods: ["run"],
    refusals: [],
    statics: {},
    traits: [],
  };
}

/** A hosted package whose manifest records `seeders` and `factories`. */
function hosted(
  name: string,
  member: string,
  extra: Record<string, unknown>,
  kind = "package",
): MemberIR["dependencies"][number] {
  return {
    package: name,
    manifest: {
      member,
      kind,
      modules: [],
      ...extra,
    } as unknown as MemberIR["dependencies"][number]["manifest"],
  };
}

/** A demo seeder `name` of `module`. */
function demoSeeder(name: string, module: string): DeclaredClass {
  return {
    ...seeder(name, "demo"),
    module,
    file: `src/modules/${module}/database/seeders/demo.seeder.ts`,
    importPath: `#modules/${module}/database/seeders/demo.seeder`,
  };
}

/** The paths of `files`. */
function paths(files: readonly { readonly path: string }[]): string[] {
  return files.map((file) => file.path);
}

describe("emitRuntimeEntries", () => {
  it("writes the server entry of a service", () => {
    const [server, ...rest] = emitRuntimeEntries(COMMERCE_IR, [".stackra/gen/registrations.ts"]);
    expect(rest).toEqual([]);
    expect(server?.path).toBe(".stackra/entry/server.ts");
    expect(server?.content).toContain('import "#stackra/registrations";');
    expect(server?.content).toContain('import { createApp } from "@stackra/app/server";');
    expect(server?.content).toContain('import { CommerceModule } from "#stackra/module";');
    expect(server?.content).toContain('import { wiring } from "#stackra/wiring";');
    expect(server?.content).toContain(
      "export const app = await createApp(CommerceModule, { wiring });",
    );
  });

  it("loads only the generated files this run writes", () => {
    const content = emitRuntimeEntries(COMMERCE_IR)[0]?.content;
    expect(content).not.toContain("#stackra/registrations");
    expect(content).not.toContain("#stackra/boot");
  });

  it("hands createApp the boot when gen writes one", () => {
    const content = emitRuntimeEntries(COMMERCE_IR, [".stackra/gen/boot.ts"])[0]?.content;
    expect(content).toContain('import { boot } from "#stackra/boot";');
    expect(content).toContain(
      "export const app = await createApp(CommerceModule, { wiring, boot });",
    );
  });

  it("writes one entry per client runtime of an app's targets", () => {
    const app = {
      ...COMMERCE_IR,
      layout: "app" as const,
      kind: "app" as const,
      targets: ["web", "ios", "android", "desktop", "pwa"],
    };
    const [browser, native, ...rest] = emitRuntimeEntries(app, [
      ".stackra/gen/routes/browser.ts",
      ".stackra/gen/blocks/native.ts",
    ]);
    expect(rest).toEqual([]);
    expect(browser?.path).toBe(".stackra/entry/browser.ts");
    expect(browser?.content).toContain('import "#stackra/routes/browser";');
    expect(browser?.content).not.toContain("#stackra/blocks/browser");
    expect(browser?.content).not.toContain("CommerceModule");
    expect(browser?.content).toContain("export const app = await createApp(wiring);");
    expect(native?.path).toBe(".stackra/entry/native.ts");
    expect(native?.content).toContain('import "#stackra/blocks/native";');
    expect(native?.content).toContain("export const app = createApp(CommerceModule, { wiring });");
    expect(native?.content).toContain('import { nativeWiring as wiring } from "#stackra/wiring";');
    expect(browser?.content).toContain('import { wiring } from "#stackra/wiring";');
  });

  it("gives an Expo-only app's native entry the shared wiring", () => {
    const app = { ...COMMERCE_IR, layout: "app" as const, kind: "app" as const, targets: ["ios"] };
    expect(emitRuntimeEntries(app)[0]?.content).toContain(
      'import { wiring } from "#stackra/wiring";',
    );
  });

  it("writes none for a package or a worker", () => {
    expect(emitRuntimeEntries(LOYALTY_KIT_IR)).toEqual([]);
    expect(emitRuntimeEntries({ ...COMMERCE_IR, layout: "worker" })).toEqual([]);
  });

  describe("the seed entry (STA-1709)", () => {
    const ir = {
      ...COMMERCE_IR,
      classes: [
        ...COMMERCE_IR.classes,
        seeder("OrdersMinimalSeeder", "minimal"),
        seeder("OrdersDemoSeeder", "demo"),
      ],
    };

    it("boots the container, connects without the relay and runs the listed seeders", () => {
      const seed = emitRuntimeEntries(ir, [
        ".stackra/gen/boot.ts",
        ".stackra/gen/registrations.ts",
      ]).find((file) => file.path === ".stackra/entry/seed.ts");
      const content = seed?.content ?? "";
      expect(content).toContain('import "#stackra/registrations";');
      expect(content).toContain(
        'import { OrdersDemoSeeder } from "#modules/orders/database/seeders/demo.seeder";',
      );
      expect(content).toContain(
        "const { container } = await bootApp(wiring, { roots: [CommerceModule], env: process.env });",
      );
      expect(content).toContain(
        "await boot(container, { signal: shutdown.signal, url: directDatabaseUrl(), relay: false });",
      );
      expect(content).toContain(
        '      { key: "orders.minimal", module: "orders", profile: "minimal", type: OrdersMinimalSeeder },',
      );
      expect(content).toContain(
        '      { key: "orders.demo", module: "orders", profile: "demo", type: OrdersDemoSeeder },',
      );
      expect(content).toContain("    argv: process.argv.slice(2),");
    });

    it("lists the constructor tokens of a seeder that injects (STA-1698)", () => {
      const injecting = {
        ...seeder("OrdersMinimalSeeder", "minimal"),
        deps: [
          {
            class: { name: "Order", from: "#modules/orders/models/order.model" },
            of: { name: "repositoryOf", from: "@stackra/database" },
          },
        ],
      };
      const content =
        emitRuntimeEntries({ ...COMMERCE_IR, classes: [...COMMERCE_IR.classes, injecting] }, [
          ".stackra/gen/boot.ts",
        ]).find((file) => file.path === ".stackra/entry/seed.ts")?.content ?? "";
      expect(content).toContain('import { Database, repositoryOf } from "@stackra/database";');
      expect(content).toContain('import { Order } from "#modules/orders/models/order.model";');
      expect(content).toContain(
        '      { key: "orders.minimal", module: "orders", profile: "minimal", type: OrdersMinimalSeeder, deps: [repositoryOf(Order)] },',
      );
    });

    it("writes none without seeders or without a boot", () => {
      expect(paths(emitRuntimeEntries(ir))).toEqual([".stackra/entry/server.ts"]);
      expect(paths(emitRuntimeEntries(COMMERCE_IR, [".stackra/gen/boot.ts"]))).toEqual([
        ".stackra/entry/server.ts",
      ]);
    });

    const kit = hosted("@acme/kit", "kit", {
      modules: [{ key: "kit", dependsOn: [] }],
      models: [{ class: "Account", file: "src/node/models/account.model.ts" }],
      seeders: [
        { key: "kit.demo", module: "kit", profile: "demo", class: "KitDemoSeeder", file: "x" },
      ],
      factories: [{ class: "AccountFactory", file: "y", model: "Account" }],
    });
    const files = [".stackra/gen/boot.ts"];
    const seedOf = (value: MemberIR): string =>
      emitRuntimeEntries(value, files).find((file) => file.path === ".stackra/entry/seed.ts")
        ?.content ?? "";

    it("registers an own factory pair before the seeders run (@covers sta-2061:FR-001)", () => {
      const content = seedOf({
        ...ir,
        classes: [
          ...ir.classes,
          {
            ...seeder("OrderFactory", "order"),
            kind: "factory",
            file: "src/modules/orders/database/factories/order.factory.ts",
            importPath: "#modules/orders/database/factories/order.factory",
            partner: { name: "Order", from: "#modules/orders/models/order.model" },
          },
        ],
      });
      expect(content).toContain(
        'import { Database, registerModelPartners } from "@stackra/database";',
      );
      expect(content).toContain("registerModelPartners([\n  [OrderFactory, Order],\n]);");
      expect(content.indexOf("registerModelPartners([")).toBeLessThan(
        content.indexOf("runSeedEntry({"),
      );
    });

    it("lists own seeders in module-dependency order, not path order (@covers sta-2061:FR-006)", () => {
      const own = demoSeeder;
      const content = seedOf({
        ...ir,
        modules: ["a_orders", "b_catalogue"],
        classes: [
          ...COMMERCE_IR.classes,
          own("OrdersSeeder", "a_orders"),
          own("CatalogueSeeder", "b_catalogue"),
          {
            ...own("PricingService", "a_orders"),
            kind: "service",
            deps: [
              { class: { name: "CatalogueService", from: "#modules/b_catalogue/services/c" } },
            ],
          },
          { ...own("CatalogueService", "b_catalogue"), kind: "service" },
        ],
      });
      expect(content.indexOf("CatalogueSeeder }")).toBeGreaterThan(-1);
      expect(content.indexOf("type: CatalogueSeeder")).toBeLessThan(
        content.indexOf("type: OrdersSeeder"),
      );
    });

    it("imports hosted seeders and factories from the package's testing entry, first (@covers sta-2061:FR-004, FR-005)", () => {
      const content = seedOf({ ...ir, dependencies: [kit] });
      expect(content).toContain(
        'import { AccountFactory, KitDemoSeeder } from "@acme/kit/testing";',
      );
      expect(content).toContain('import { Account } from "@acme/kit/node";');
      expect(content).toContain("  [AccountFactory, Account],");
      expect(content.indexOf("type: KitDemoSeeder")).toBeLessThan(
        content.indexOf("type: OrdersMinimalSeeder"),
      );
    });

    it("imports a hosted model the manifest does not list from the package's node entry (@covers sta-2061:EC-07)", () => {
      const unlisted = hosted("@acme/ledger", "ledger", {
        factories: [{ class: "EntryFactory", file: "y", model: "Entry" }],
        seeders: kit.manifest["seeders"],
      });
      expect(seedOf({ ...ir, dependencies: [unlisted] })).toContain(
        'import { Entry } from "@acme/ledger/node";',
      );
    });

    it("lists a hosted package after the hosted package its modules depend on (@covers sta-2061:FR-006)", () => {
      const upper = hosted("@acme/upper", "upper", {
        modules: [{ key: "upper", dependsOn: ["kit"] }],
        seeders: [
          { key: "upper.demo", module: "upper", profile: "demo", class: "UpperSeeder", file: "x" },
        ],
      });
      const content = seedOf({ ...ir, dependencies: [upper, kit] });
      expect(content.indexOf("type: KitDemoSeeder")).toBeLessThan(
        content.indexOf("type: UpperSeeder"),
      );
    });

    it("writes the entry for a service with only hosted seeders, and ignores an app and an old manifest (@covers sta-2061:FR-007)", () => {
      const app = hosted("@acme/app", "app", { seeders: kit.manifest["seeders"] }, "app");
      const old = hosted("@acme/old", "old", {});
      expect(seedOf({ ...COMMERCE_IR, dependencies: [kit, app, old] })).toContain("KitDemoSeeder");
      expect(seedOf({ ...COMMERCE_IR, dependencies: [app, old] })).toBe("");
    });

    it("aliases a clashing import (@covers sta-2061:FR-008)", () => {
      const clash = hosted("@acme/clash", "clash", {
        seeders: [
          {
            key: "clash.demo",
            module: "clash",
            profile: "demo",
            class: "OrdersDemoSeeder",
            file: "x",
          },
        ],
      });
      const content = seedOf({ ...ir, dependencies: [clash] });
      expect(content).toContain("OrdersDemoSeeder as ImportedOrdersDemoSeeder");
      expect(content).toContain("type: ImportedOrdersDemoSeeder");
    });

    it("writes no registerModelPartners without factories", () => {
      expect(seedOf(ir)).not.toContain("registerModelPartners([");
    });
  });
});
