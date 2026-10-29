/**
 * Stackra file contract:
 * Purpose: unit tests of `generate`: a write run puts the manifest, schemas, wiring and entries on disk; a second run
 *          changes nothing; a check run reports a stale file without writing; a changed identity without `@Renamed`
 *          fails against the committed manifest and writes nothing; a member consuming a workspace service with no
 *          manifest yet gets its manifest alone (with `pass: "manifests"`, or as what a refused run still writes); the root `vitest.config.ts` shim is written,
 *          an authored one that merges `./.stackra/vitest.config` is kept (STA-1297), and any other is refused as
 *          `shim_authored` (STA-1296); a check fails `manifest_unshipped` when a package's `files` leaves the manifest
 *          out, and reports a missing manifest as stale (STA-1308); an authored root tsdown.config.ts that does not
 *          merge the generated one is `shim_authored`, and a `*.extend.ts` hatch outside the closed set or without its
 *          `Reason:` header is `tool_reason_missing` (STA-1306); an `encore.app` at the member root is
 *          `encore_app_stray` (STA-1322); an authored `app.json` or root `app.config.ts` beside an iOS app's Expo
 *          config is `shim_authored`, and the shim gen wrote is not (STA-768); a v2 service (authored `src/main.ts`)
 *          gets no entry, tool config or encore.app and passes, while the same service in the v3 shape is still
 *          `generated_dependency_missing` (STA-344).
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

  it("refuses a hand-made encore.app at the member root (STA-1322)", async () => {
    const root = writeFixtureMember("shop", { ...SHOP_SOURCES, "encore.app": "{}\n" });
    const result = await generate(root);
    expect(result.errors.map((error) => `${error.code} ${error.file}`)).toEqual([
      "encore_app_stray encore.app",
    ]);
    expect(existsSync(join(root, ".stackra/encore/encore.app"))).toBe(false);
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
      ".stackra/encore/encore.app",
      "vitest.config.ts",
    ])
      expect(existsSync(join(root, path))).toBe(false);
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
});
