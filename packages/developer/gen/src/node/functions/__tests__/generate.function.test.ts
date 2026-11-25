/**
 * Stackra file contract:
 * Purpose: unit tests of `generate`: a write run puts the manifest, schemas, wiring and entries on disk; a second run
 *          changes nothing; a check run reports a stale file without writing; a changed identity without `@Renamed`
 *          fails against the committed manifest and writes nothing; a member consuming a workspace service with no
 *          manifest yet gets its manifest alone (with `pass: "manifests"`, or as what a refused run still writes); the root `vitest.config.ts` shim is written,
 *          an authored one that merges `./.stackra/vitest.config` is kept (STA-1297), and any other is refused as
 *          `shim_authored` (STA-1296); a check fails `manifest_unshipped` when a package's `files` leaves the manifest
 *          out, and reports a missing manifest as stale (STA-1308), but not missing gitignored output (STA-1742); an authored root tsdown.config.ts that does not
 *          merge the generated one is `shim_authored`, and a `*.extend.ts` hatch outside the closed set or without its
 *          `Reason:` header is `tool_reason_missing` (STA-1306); an `encore.app` at the repository root is
 *          `encore_app_stray` (STA-1322); an authored `app.json` or root `app.config.ts` beside an iOS app's Expo
 *          config is `shim_authored`, and the shim gen wrote is not (STA-768); a v2 service (authored `src/main.ts`)
 *          gets no entry, tool config or encore.app and passes, while the same service in the v3 shape is still
 *          `generated_dependency_missing` (STA-344); a `.stackra/gen/blueprint.ts` left after the last own macro is gone
 *          is reported by a check run and deleted by a write run (STA-2062); a service's compiled migrations and their
 *          Encore copies are committed output (STA-2788): written deterministically, and a check fails on committed SQL
 *          edited by hand, on sources the committed SQL has not caught up with, on a missing file and on a leftover one
 *          (which a write run deletes), while a manifests pass leaves them alone.
 * Boundary: test only; writes the shop fixture under `.cache/` and runs gen on it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 10 and 22); ADR 0295 (decision 5).
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { generate } from "#node/functions/generate.function";
import { SHOP_SOURCES } from "#node/__tests__/fixtures/shop-sources.fixture";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

describe("generate", () => {
  it("writes, then finds nothing to change, then checks", async () => {
    const root = writeFixtureMember("shop", SHOP_SOURCES);
    const first = await generate(root);
    expect(first.errors).toEqual([]);
    expect(first.changed).toEqual(
      expect.arrayContaining([
        "stackra.manifest.json",
        ".stackra/gen/wiring.ts",
        ".stackra/entry/node.ts",
      ]),
    );
    expect(existsSync(join(root, ".stackra/gen/schemas/shop.ts"))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(root, "stackra.manifest.json"), "utf8")) as {
      actions: { key: string }[];
    };
    expect(manifest.actions.map((action) => action.key)).toEqual(["shop.order.cancel@1"]);

    expect((await generate(root)).changed).toEqual([]);

    writeFileSync(join(root, ".stackra/gen/wiring.ts"), "// edited by hand\n");
    const check = await generate(root, { check: true });
    expect(check.changed).toEqual([".stackra/gen/wiring.ts"]);
    expect(readFileSync(join(root, ".stackra/gen/wiring.ts"), "utf8")).toBe("// edited by hand\n");
  });

  it("imports each schemas file in the test setup, and a check flags a setup whose modules changed (STA-2032)", async () => {
    const root = writeFixtureMember("shop", SHOP_SOURCES);
    expect((await generate(root)).errors).toEqual([]);
    const setupPath = join(root, ".stackra/vitest.setup.ts");
    const setup = readFileSync(setupPath, "utf8");
    expect(setup).toContain('import "./gen/schemas/shop.ts";');
    expect(setup).not.toContain("loadMemberSchemas");

    // A setup written before the module existed, or after one was removed, no longer matches: `--check` reports it.
    writeFileSync(setupPath, setup.replace('import "./gen/schemas/shop.ts";\n', ""));
    expect((await generate(root, { check: true })).changed).toEqual([".stackra/vitest.setup.ts"]);
    writeFileSync(
      setupPath,
      setup.replace('import "./gen/schemas/shop.ts";', 'import "./gen/schemas/gone.ts";'),
    );
    expect((await generate(root, { check: true })).changed).toEqual([".stackra/vitest.setup.ts"]);
  });

  it("writes the integration-tier config only for a member with an .int.test.ts (STA-1819)", async () => {
    const root = writeFixtureMember("shop", SHOP_SOURCES);
    await generate(root);
    expect(existsSync(join(root, ".stackra/vitest.int.config.ts"))).toBe(false);
    const test = join(root, "src/node/__tests__/orders.int.test.ts");
    mkdirSync(dirname(test), { recursive: true });
    writeFileSync(test, "");
    const result = await generate(root);
    expect(result.errors).toEqual([]);
    expect(result.changed).toContain(".stackra/vitest.int.config.ts");
    expect(readFileSync(join(root, ".stackra/vitest.int.config.ts"), "utf8")).toContain(
      "export default intTier(config);",
    );
  });

  it("writes the e2e app and Playwright config only for a package with an .e2e.page.tsx", async () => {
    const root = writeFixtureMember("shop", SHOP_SOURCES);
    await generate(root);
    expect(existsSync(join(root, ".stackra/playwright.e2e.config.ts"))).toBe(false);
    expect(existsSync(join(root, ".stackra/e2e"))).toBe(false);
    const page = join(root, "src/node/__tests__/orders.e2e.page.tsx");
    mkdirSync(dirname(page), { recursive: true });
    writeFileSync(page, "export default () => null;\n");
    const result = await generate(root);
    expect(result.errors).toEqual([]);
    expect(result.changed).toEqual(
      expect.arrayContaining([
        ".stackra/e2e/index.html",
        ".stackra/e2e/main.tsx",
        ".stackra/e2e/vite.config.ts",
        ".stackra/playwright.e2e.config.ts",
      ]),
    );
    expect(readFileSync(join(root, ".stackra/playwright.e2e.config.ts"), "utf8")).toContain(
      "packageE2ePreset",
    );
  });

  it("refuses a changed identity without @Renamed", async () => {
    const root = writeFixtureMember("shop", SHOP_SOURCES);
    await generate(root);
    const action = join(root, "src/node/actions/cancel-order.action.ts");
    writeFileSync(
      action,
      readFileSync(action, "utf8").replace('key: "order.cancel"', 'key: "order.void"'),
    );
    const permissions = join(root, "src/node/access/order.permissions.ts");
    writeFileSync(
      permissions,
      readFileSync(permissions, "utf8").replace("static readonly cancel", "static readonly void"),
    );
    const result = await generate(root);
    expect(result.errors.map((error) => error.code)).toEqual(["identity_changed"]);
    expect(result.changed).toEqual([]);
  });
});

/** A member injecting the catalogue client, with a catalogue folder (no manifest yet) beside it. */
function waitingMember(): string {
  const root = writeFixtureMember("channels", {
    "src/core/services/sync.service.ts": [
      'import { Service } from "@stackra/container";',
      'import type { CatalogueClient } from "#stackra/clients/catalogue";',
      "export class SyncService extends Service {",
      "  constructor(private readonly catalogue: CatalogueClient) {",
      "    super();",
      "  }",
      "}",
      "",
    ].join("\n"),
  });
  mkdirSync(join(dirname(root), "catalogue"), { recursive: true });
  writeFileSync(join(dirname(root), "catalogue", "package.json"), "{}");
  return root;
}

describe("generate across a cycle between services", () => {
  it("writes the manifest alone in the manifest pass", async () => {
    const root = waitingMember();
    const result = await generate(root, { pass: "manifests" });
    expect(result.errors).toEqual([]);
    expect(result.changed).toEqual(["stackra.manifest.json"]);
    expect(existsSync(join(root, ".stackra/gen/wiring.ts"))).toBe(false);
  });

  it("refuses the full run but still writes the manifest", async () => {
    const root = waitingMember();
    const result = await generate(root);
    expect(result.errors.map((error) => error.code)).toEqual(["client_service_unknown"]);
    expect(result.changed).toEqual(["stackra.manifest.json"]);
    expect(existsSync(join(root, ".stackra/gen/wiring.ts"))).toBe(false);
    expect((await generate(root, { check: true })).changed).toEqual([]);
  });
});

describe("generate's root Vitest shim (STA-1296)", () => {
  it("writes the shim that re-exports the generated config", async () => {
    const root = writeFixtureMember("shop", SHOP_SOURCES);
    expect((await generate(root)).errors).toEqual([]);
    expect(readFileSync(join(root, "vitest.config.ts"), "utf8")).toContain(
      'export { default } from "./.stackra/vitest.config";',
    );
  });

  it("refuses to replace an authored root vitest.config.ts", async () => {
    const root = writeFixtureMember("shop", {
      ...SHOP_SOURCES,
      "vitest.config.ts": "export default {};\n",
    });
    const result = await generate(root);
    expect(result.errors.map((error) => error.code)).toEqual(["shim_authored"]);
    expect(readFileSync(join(root, "vitest.config.ts"), "utf8")).toBe("export default {};\n");
  });

  it("keeps an authored root vitest.config.ts that merges the generated config (STA-1297)", async () => {
    const authored =
      'import { mergeConfig } from "vitest/config";\n\nimport generated from "./.stackra/vitest.config";\n\n' +
      "export default mergeConfig(generated, { test: { testTimeout: 10_000 } });\n";
    const root = writeFixtureMember("shop", { ...SHOP_SOURCES, "vitest.config.ts": authored });
    const result = await generate(root);
    expect(result.errors).toEqual([]);
    expect(result.files.map((file) => file.path)).not.toContain("vitest.config.ts");
    expect(readFileSync(join(root, "vitest.config.ts"), "utf8")).toBe(authored);
    expect(existsSync(join(root, ".stackra/vitest.config.ts"))).toBe(true);
  });
});

describe("generate's tool configs and code hatches (STA-1306)", () => {
  it("refuses an authored root tsdown.config.ts that does not merge the generated one", async () => {
    const root = writeFixtureMember("shop", {
      ...SHOP_SOURCES,
      "tsdown.config.ts": "export default {};\n",
    });
    const result = await generate(root);
    expect(result.errors.map((error) => `${error.code} ${error.file}`)).toEqual([
      "shim_authored tsdown.config.ts",
    ]);
    expect(existsSync(join(root, ".stackra/gen/wiring.ts"))).toBe(false);
  });

  it("keeps an authored root tsdown.config.ts that imports the generated one", async () => {
    const root = writeFixtureMember("shop", {
      ...SHOP_SOURCES,
      "tsdown.config.ts":
        'import generated from "./.stackra/tsdown.config";\n\nexport default generated;\n',
    });
    expect((await generate(root)).errors).toEqual([]);
  });

  it("refuses a hatch outside the closed set or without its Reason: header", async () => {
    const root = writeFixtureMember("shop", {
      ...SHOP_SOURCES,
      "metro.extend.ts": "export default {};\n",
      "webpack.extend.ts": "// Reason: legacy loader\nexport default {};\n",
      "vite.extend.ts":
        "/**\n * Reason: the PWA plugin needs a custom manifest path.\n */\nexport default {};\n",
    });
    const result = await generate(root);
    expect(result.errors.map((error) => `${error.code} ${error.file}`)).toEqual([
      "tool_reason_missing metro.extend.ts",
      "tool_reason_missing webpack.extend.ts",
    ]);
  });
});

/**
 * A service shaped like services/example: a root module, an authored tsdown.config.ts and only its dependencies (no
 * `@stackra/app` or `@stackra/vitest-config`); with `main`, the authored `src/main.ts` of the v2 shape (STA-344).
 */
function exampleService(main: boolean): string {
  const root = writeFixtureMember("example", {
    "stackra.config.ts":
      'import { defineService } from "@stackra/contracts";\n\nexport default defineService({});\n',
    "src/example.module.ts":
      'import { Module } from "@stackra/container";\n\nexport class ExampleModule extends Module({ imports: [] }) {}\n',
    "tsdown.config.ts": 'export default { entry: ["src/main.ts"] };\n',
    ...(main ? { "src/main.ts": 'process.stdout.write("hello\\n");\n' } : {}),
  });
  const path = join(root, "package.json");
  // services/example's own dependencies, so nothing else the fixture declares changes what gen writes.
  const pkg = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  pkg["dependencies"] = {
    "@stackra/container": "workspace:*",
    "@stackra/tsdown-config": "workspace:*",
    // Its generated Encore files import it (STA-2194).
    "encore.dev": "catalog:",
  };
  writeFileSync(path, JSON.stringify(pkg));
  return root;
}

describe("generate's v2 services (authored src/main.ts, until STA-344)", () => {
  it("writes no entry, tool config or encore.app for a v2 service and refuses nothing", async () => {
    const root = exampleService(true);
    const result = await generate(root);
    expect(result.errors).toEqual([]);
    expect(result.changed).toContain("stackra.manifest.json");
    for (const path of [
      ".stackra/entry/server.ts",
      ".stackra/vitest.config.ts",
      ".stackra/tsdown.config.ts",
      "encore.app",
      "vitest.config.ts",
    ])
      expect(existsSync(join(root, path))).toBe(false);
  });

  it("reports, then deletes, a blueprint.ts left over after the last own macro is gone", async () => {
    const root = exampleService(true);
    const stale = join(root, ".stackra/gen/blueprint.ts");
    mkdirSync(dirname(stale), { recursive: true });
    writeFileSync(
      stale,
      'import type { GoneMacro } from "#modules/example/database/macros/gone.macro";\n',
    );
    expect((await generate(root, { check: true })).changed).toContain(".stackra/gen/blueprint.ts");
    expect(existsSync(stale)).toBe(true);
    expect((await generate(root)).changed).toContain(".stackra/gen/blueprint.ts");
    expect(existsSync(stale)).toBe(false);
  });

  it("still refuses a v3 service that does not declare what its generated files import", async () => {
    const result = await generate(exampleService(false));
    expect(result.errors.map((error) => error.code)).not.toEqual([]);
    expect(result.errors.every((error) => error.code === "generated_dependency_missing")).toBe(
      true,
    );
    expect(result.errors.map((error) => error.subject)).toEqual(
      expect.arrayContaining(["@stackra/app", "@stackra/vitest-config"]),
    );
    expect(result.changed).not.toContain(".stackra/entry/server.ts");
  });
});

/** An iOS app member: `defineApp` with a bundle id, so gen writes the Expo config and its root shim. */
const IOS_APP: Readonly<Record<string, string>> = {
  "stackra.config.ts": [
    'import { ApiArea, defineApp, Target } from "@stackra/contracts";',
    "",
    "export default defineApp({",
    "  targets: [Target.Ios],",
    "  area: ApiArea.App,",
    '  name: "Acme",',
    '  scheme: "acme",',
    '  ios: { bundleId: "com.acme.app" },',
    "});",
    "",
  ].join("\n"),
  "src/types/acme.type.ts": "export type Acme = string;\n",
};

describe("generate's Expo config shim (STA-768)", () => {
  it("refuses an authored app.json and an authored root app.config.ts", async () => {
    const root = writeFixtureMember("mobile", {
      ...IOS_APP,
      "app.json": '{ "expo": { "name": "Acme" } }\n',
      "app.config.ts": 'export default { name: "Acme" };\n',
    });
    const result = await generate(root);
    expect(
      result.errors.filter((error) => error.code === "shim_authored").map((error) => error.subject),
    ).toEqual(["app.json", "app.config.ts"]);
    expect(readFileSync(join(root, "app.config.ts"), "utf8")).toBe(
      'export default { name: "Acme" };\n',
    );
  });

  it("does not refuse the shim gen wrote on a second run", async () => {
    const root = writeFixtureMember("mobile", IOS_APP);
    expect((await generate(root)).errors).toEqual([]);
    expect(readFileSync(join(root, "app.config.ts"), "utf8")).toContain(
      'export { default } from "./.stackra/app.config";',
    );
    expect((await generate(root)).errors).toEqual([]);
  });
});

/** Sets `files` in the member's package.json. */
const shipping = (root: string, files: readonly string[]): void => {
  const path = join(root, "package.json");
  writeFileSync(path, JSON.stringify({ ...JSON.parse(readFileSync(path, "utf8")), files }));
};

describe("generate's shipped manifest check (STA-1308)", () => {
  it("fails a check when package.json `files` leaves the manifest out", async () => {
    const root = writeFixtureMember("shop", SHOP_SOURCES);
    expect((await generate(root)).errors).toEqual([]);
    shipping(root, ["dist", "src"]);
    const check = await generate(root, { check: true });
    expect(check.errors.map((error) => error.code)).toEqual(["manifest_unshipped"]);
    shipping(root, ["dist", "src", "stackra.manifest.json"]);
    expect((await generate(root, { check: true })).errors).toEqual([]);
  });

  it("reports a missing manifest as stale", async () => {
    const root = writeFixtureMember("shop", SHOP_SOURCES);
    expect((await generate(root)).errors).toEqual([]);
    rmSync(join(root, "stackra.manifest.json"));
    expect((await generate(root, { check: true })).changed).toEqual(["stackra.manifest.json"]);
  });

  it("passes a clean clone, which has no gitignored output yet (STA-1742)", async () => {
    const root = writeFixtureMember("shop", SHOP_SOURCES);
    expect((await generate(root)).errors).toEqual([]);
    rmSync(join(root, ".stackra"), { recursive: true, force: true });
    rmSync(join(root, "vitest.config.ts"), { force: true });
    const check = await generate(root, { check: true });
    expect(check.errors).toEqual([]);
    expect(check.changed).toEqual([]);
    expect(existsSync(join(root, ".stackra"))).toBe(false);
  });
});

/** A fake `@stackra/database` whose `compileMigration` turns each `schema.create(table)` into one statement. */
const FAKE_DATABASE: Readonly<Record<string, string>> = {
  "node_modules/@stackra/database/package.json": JSON.stringify({
    name: "@stackra/database",
    type: "module",
    types: "./index.d.ts",
    exports: { ".": { types: "./index.d.ts", default: "./index.js" } },
  }),
  "node_modules/@stackra/database/index.d.ts": [
    "export interface SchemaBuilder { create(table: string): void }",
    "export declare abstract class Migration { abstract up(schema: SchemaBuilder): void }",
    "",
  ].join("\n"),
  "node_modules/@stackra/database/index.js": [
    "export class Macro {}",
    "export class Migration {}",
    "export const compileMigration = (type, options) => {",
    "  const tables = [];",
    "  new type().up({ create: (table) => tables.push(table) });",
    "  return {",
    "    after: [],",
    "    steps: tables.map((table) => ({",
    '      sql: [`create table "${options.schema}"."${table}" ("id" text primary key)`],',
    "      transactional: true,",
    '      inverse: [`drop table "${options.schema}"."${table}"`],',
    "    })),",
    "  };",
    "};",
    "",
  ].join("\n"),
};

/** A migration file whose one class, `<className>Migration`, creates `table`. */
const migrationSource = (className: string, table: string): string =>
  [
    'import { Migration, type SchemaBuilder } from "@stackra/database";',
    "",
    `export class ${className}Migration extends Migration {`,
    "  up(schema: SchemaBuilder): void {",
    `    schema.create(${JSON.stringify(table)});`,
    "  }",
    "}",
    "",
  ].join("\n");

/** One migration of the `orders` module, `<name>.migration.ts` with class `<className>Migration`, that creates `table`. */
const ordersMigration = (
  name: string,
  className: string,
  table: string,
): Record<string, string> => ({
  [`src/modules/orders/database/migrations/${name}.migration.ts`]: migrationSource(
    className,
    table,
  ),
});

/**
 * A v3 service with one migration, in a workspace whose root runway names an Encore app, so a full run writes the
 * compiled stream and its Encore copy.
 */
function migratedService(first = migrationSource("CreateOrders", "orders")): string {
  const root = writeFixtureMember("orders", {
    "stackra.config.ts":
      'import { defineService } from "@stackra/contracts";\n\nexport default defineService({});\n',
    ...FAKE_DATABASE,
    "src/modules/orders/database/migrations/0001-create-orders.migration.ts": first,
  });
  writeFileSync(join(dirname(root), "pnpm-workspace.yaml"), "packages:\n  - orders\n");
  writeFileSync(
    join(dirname(root), "runway.yaml"),
    "version: 3\nproject: acme\nproviders:\n  encore:\n    app: acme-x1\n",
  );
  return root;
}

/** The compiled stream of the fixture service and its Encore copy. */
const UP = ".stackra/migrations/0001_orders_0001_create_orders.up.sql";
const DOWN = ".stackra/migrations/0001_orders_0001_create_orders.down.sql";
const ENCORE_UP = "stackra-encore/orders/migrations/0001_orders_0001_create_orders.up.sql";

describe("generate's committed compiled migrations (STA-2788)", () => {
  it("writes the compiled stream and its Encore copy, then a check finds nothing to change", async () => {
    const root = migratedService();
    const first = await generate(root);
    expect(first.errors).toEqual([]);
    expect(first.changed).toEqual(expect.arrayContaining([UP, DOWN, ENCORE_UP]));
    expect(readFileSync(join(root, UP), "utf8")).toContain(
      'create table "orders"."orders" ("id" text primary key);',
    );
    expect(readFileSync(join(root, ENCORE_UP), "utf8")).toBe(readFileSync(join(root, UP), "utf8"));
    // Deterministic: a second run and a check change nothing.
    expect((await generate(root)).changed).toEqual([]);
    expect((await generate(root, { check: true })).changed).toEqual([]);
  });

  it("fails a check when the committed SQL was edited by hand, and writes nothing", async () => {
    const root = migratedService();
    expect((await generate(root)).errors).toEqual([]);
    // A hand edit to the committed SQL (what a deploy would apply) and to its Encore copy.
    writeFileSync(join(root, UP), "drop table orders;\n");
    writeFileSync(join(root, ENCORE_UP), "drop table orders;\n");
    const check = await generate(root, { check: true });
    expect(check.errors).toEqual([]);
    expect(check.changed).toEqual(expect.arrayContaining([UP, ENCORE_UP]));
    expect(readFileSync(join(root, UP), "utf8")).toBe("drop table orders;\n");
  });

  it("fails a check when the sources changed and the committed SQL did not catch up", async () => {
    // The committed tree: SQL compiled from the earlier source.
    const before = migratedService();
    expect((await generate(before)).errors).toEqual([]);
    // The same service after its migration changed (a fresh member: Node caches an imported migration by path).
    const root = migratedService(migrationSource("CreateOrders", "purchases"));
    expect((await generate(root)).errors).toEqual([]);
    for (const path of [UP, DOWN, ENCORE_UP])
      writeFileSync(join(root, path), readFileSync(join(before, path), "utf8"));
    expect([...(await generate(root, { check: true })).changed].toSorted()).toEqual(
      [UP, DOWN, ENCORE_UP].toSorted(),
    );
  });

  it("fails a check when a compiled migration is not committed, unlike gitignored output (STA-1742)", async () => {
    const root = migratedService();
    expect((await generate(root)).errors).toEqual([]);
    rmSync(join(root, UP));
    rmSync(join(root, ENCORE_UP));
    rmSync(join(root, ".stackra/gen"), { recursive: true, force: true });
    const check = await generate(root, { check: true });
    expect([...check.changed].toSorted()).toEqual([UP, ENCORE_UP].toSorted());
  });

  it("reports, then deletes, a compiled file and its Encore copy whose migration is gone", async () => {
    const root = migratedService();
    const second = ordersMigration("0002-create-refunds", "CreateRefunds", "refunds");
    for (const [path, content] of Object.entries(second)) writeFileSync(join(root, path), content);
    expect((await generate(root)).errors).toEqual([]);
    const stale = [
      ".stackra/migrations/0002_orders_0002_create_refunds.up.sql",
      "stackra-encore/orders/migrations/0002_orders_0002_create_refunds.up.sql",
    ];
    for (const path of stale) expect(existsSync(join(root, path)), path).toBe(true);
    for (const path of Object.keys(second)) rmSync(join(root, path));
    expect((await generate(root, { check: true })).changed).toEqual(expect.arrayContaining(stale));
    for (const path of stale) expect(existsSync(join(root, path)), path).toBe(true);
    expect((await generate(root)).changed).toEqual(expect.arrayContaining(stale));
    for (const path of stale) expect(existsSync(join(root, path)), path).toBe(false);
  });

  it("leaves the committed migrations alone in a manifests pass, which compiles none", async () => {
    const root = migratedService();
    expect((await generate(root)).errors).toEqual([]);
    const manifests = await generate(root, { pass: "manifests" });
    expect(manifests.changed).not.toContain(UP);
    expect(existsSync(join(root, UP))).toBe(true);
    expect(existsSync(join(root, ENCORE_UP))).toBe(true);
  });
});

/** A package with one migration of its own, compiled by the fake database. */
function migratedPackage(): string {
  return writeFixtureMember("ledger", {
    ...FAKE_DATABASE,
    "src/node/database/migrations/0001-create-entries.migration.ts": migrationSource(
      "CreateEntries",
      "entries",
    ),
  });
}

/** The committed SQL of the fixture package's one migration. */
const PACKAGE_UP = "src/node/database/compiled-migrations/ledger_0001_create_entries.up.sql";
const PACKAGE_DOWN = "src/node/database/compiled-migrations/ledger_0001_create_entries.down.sql";

describe("generate's committed package migrations (STA-2788)", () => {
  it("writes the package's committed SQL beside its test stream, then a check finds nothing to change", async () => {
    const root = migratedPackage();
    const first = await generate(root);
    expect(first.errors).toEqual([]);
    expect(first.changed).toEqual(expect.arrayContaining([PACKAGE_UP, PACKAGE_DOWN]));
    expect(readFileSync(join(root, PACKAGE_UP), "utf8")).toContain(
      'create table "ledger"."entries" ("id" text primary key);',
    );
    // The test stream stays gen's scratch, with the same step under its sequence number.
    expect(
      readFileSync(
        join(root, ".stackra/tests/migrations/0001_ledger_0001_create_entries.up.sql"),
        "utf8",
      ),
    ).toContain('create table "ledger"."entries"');
    expect((await generate(root)).changed).toEqual([]);
    expect((await generate(root, { check: true })).changed).toEqual([]);
  });

  it("fails a check on committed SQL that drifted, is missing or is left over, and a write run repairs it", async () => {
    const root = migratedPackage();
    expect((await generate(root)).errors).toEqual([]);
    writeFileSync(join(root, PACKAGE_UP), "drop table entries;\n");
    rmSync(join(root, PACKAGE_DOWN));
    const leftover = "src/node/database/compiled-migrations/ledger_0002_gone.up.sql";
    writeFileSync(join(root, leftover), "select 1;\n");
    expect([...(await generate(root, { check: true })).changed].toSorted()).toEqual(
      [PACKAGE_UP, PACKAGE_DOWN, leftover].toSorted(),
    );
    expect(readFileSync(join(root, PACKAGE_UP), "utf8")).toBe("drop table entries;\n");
    expect([...(await generate(root)).changed].toSorted()).toEqual(
      [PACKAGE_UP, PACKAGE_DOWN, leftover].toSorted(),
    );
    expect(existsSync(join(root, leftover))).toBe(false);
    expect((await generate(root, { check: true })).changed).toEqual([]);
  });

  it("removes the committed SQL once the package's last migration is gone", async () => {
    const root = migratedPackage();
    expect((await generate(root)).errors).toEqual([]);
    rmSync(join(root, "src/node/database/migrations"), { recursive: true });
    expect((await generate(root, { check: true })).changed).toEqual(
      expect.arrayContaining([PACKAGE_UP, PACKAGE_DOWN]),
    );
    expect((await generate(root)).errors).toEqual([]);
    expect(existsSync(join(root, PACKAGE_UP))).toBe(false);
  });
});
