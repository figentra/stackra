/**
 * Stackra file contract:
 * Purpose: unit tests of `emitRuntimeEntries`: a service gets `server`, which loads its registrations when they are
 *          written and hands `createApp` its boot when gen writes one; an app gets `browser` (web, PWA, desktop renderer) and `native` (iOS, Android), each in the form
 *          its `createApp` takes and loading the route table and blocks this run writes, the native one of a
 *          web-and-native app on `nativeWiring`; a package and a worker get none; a service with seeders and a boot
 *          gets `seed` (STA-1709).
 * Boundary: test only; runs on the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0295 (decisions 7 to 9).
 */
import { describe, expect, it } from "@stackra/testing";

import { emitRuntimeEntries } from "#core/functions/emit-runtime-entries.function";
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
  });
});
