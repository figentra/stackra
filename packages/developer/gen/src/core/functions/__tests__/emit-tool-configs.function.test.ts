/**
 * Stackra file contract:
 * Purpose: unit tests of `emitToolConfigs`: a package or service gets tsdown with one entry per generated entry file,
 *          Vitest on the decorators preset with the coverage gate, the unit tier only and the generated setup, and the
 *          setup that loads the registrations when they exist, the database testing entry for a member on
 *          `@stackra/database`, registers the wiring, awaits the member's schemas and pairs each factory with its
 *          model; no tsdown without entries, and nothing for an app or a worker. A member off `@stackra/container`
 *          (`@stackra/testing`, rule 6c) gets a setup with no container import, wiring or schemas (STA-1365 item 8).
 * Boundary: test only; runs on the IR fixtures.
 * The root `vitest.config.ts` shim is listed with the tool configs (STA-1296).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0295 (decision 5); ADR 0182; ADR 0263 (decision 12); STA-1365.
 */
import { describe, expect, it } from "@stackra/testing";

import { emitToolConfigs } from "#core/functions/emit-tool-configs.function";
import { schemaModules } from "#core/functions/schema-modules.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

/** The generated vitest config of `ir`. */
function vitestConfigOf(ir: typeof LOYALTY_KIT_IR): string {
  return (
    emitToolConfigs(ir, { entries: [], registrations: false }).find(
      (file) => file.path === ".stackra/vitest.config.ts",
    )?.content ?? ""
  );
}

/** A seeder of the plans module taking `deps`. */
function plansSeeder(name: string, deps: DeclaredClass["deps"]): DeclaredClass {
  return {
    name,
    kind: "seeder",
    module: "plans",
    file: `src/modules/plans/database/seeders/${name}.seeder.ts`,
    importPath: `#modules/plans/database/seeders/${name}.seeder`,
    options: {},
    deps,
    facets: [],
    methods: ["run"],
    refusals: [],
    statics: {},
    traits: [],
  };
}

describe("emitToolConfigs", () => {
  const files = emitToolConfigs(BILLING_IR, {
    entries: [
      { path: ".stackra/entry/server.ts", content: "" },
      { path: ".stackra/gen/wiring.ts", content: "" },
    ],
    registrations: true,
  });
  const content = (path: string): string => files.find((file) => file.path === path)?.content ?? "";

  it("writes tsdown, vitest, the setup and a service's typecheck tsconfig", () => {
    expect(files.map((file) => file.path)).toEqual([
      ".stackra/tsdown.config.ts",
      ".stackra/vitest.config.ts",
      ".stackra/vitest.setup.ts",
      ".stackra/tsconfig.typecheck.json",
      "vitest.config.ts",
    ]);
    expect(content(".stackra/tsdown.config.ts")).toContain(
      'const config: ReturnType<typeof library> = library({\n  "server": ".stackra/entry/server.ts",\n});\n\nexport default config;',
    );
  });

  it("types a service's program without the paths that exist for Encore, and a package's not at all", () => {
    const typecheck = JSON.parse(content(".stackra/tsconfig.typecheck.json")) as Record<
      string,
      unknown
    >;
    expect(typecheck).toMatchObject({
      extends: "../tsconfig.json",
      include: ["../**/*"],
      compilerOptions: { paths: {} },
    });
    const pkg = emitToolConfigs(LOYALTY_KIT_IR, { entries: [], registrations: false });
    expect(pkg.map((file) => file.path)).not.toContain(".stackra/tsconfig.typecheck.json");
  });

  it("gives a package, not a service, the root tsdown shim", () => {
    expect(content("tsdown.config.ts")).toBe("");
    const pkg = emitToolConfigs(LOYALTY_KIT_IR, {
      entries: [{ path: ".stackra/entry/index.ts", content: "" }],
      registrations: false,
    });
    // The re-export names the generated config with its extension (tsdown's native loader needs it).
    const shim = pkg.find((file) => file.path === "tsdown.config.ts")?.content;
    expect(shim).toContain("export { default } from ");
    expect(shim).toContain('"./.stackra/tsdown.config.ts";');
    const tsdown = pkg.find((file) => file.path === ".stackra/tsdown.config.ts")?.content;
    expect(tsdown).toContain('"index": fileURLToPath(new URL("entry/index.ts", import.meta.url)),');
    expect(tsdown).toContain(
      'dts: { tsconfig: fileURLToPath(new URL("../tsconfig.build.json", import.meta.url)) },',
    );
    const tsconfig = JSON.parse(
      pkg.find((file) => file.path === "tsconfig.build.json")?.content ?? "{}",
    ) as Record<string, unknown>;
    expect(tsconfig["extends"]).toBe("./tsconfig.json");
    expect(tsconfig["include"]).toEqual(["src", ".stackra/entry"]);
    // oxfmt's layout, so the member's format check passes on the file as written.
    expect(pkg.find((file) => file.path === "tsconfig.build.json")?.content).toContain(
      '  "include": ["src", ".stackra/entry"],\n  "exclude": ["src/**/__tests__/**", "src/*.ts", "src/*.tsx"]\n}\n',
    );
    expect(content("tsconfig.build.json")).toBe("");
  });

  it("runs the unit tier on the decorators preset with the coverage gate", () => {
    const vitest = content(".stackra/vitest.config.ts");
    expect(vitest).toContain(
      'import { stackraVitestDecorators } from "@stackra/vitest-config/preset-decorators";',
    );
    expect(vitest).toContain("  withCoverage({");
    expect(vitest).not.toContain("defineConfig");
    expect(vitest).not.toContain("defineConfig");
    expect(vitest).toContain('      exclude: ["**/*.{int,contract,e2e,load}.test.{ts,tsx}"],');
    expect(vitest).toContain('      setupFiles: [".stackra/vitest.setup.ts"],');
    expect(vitest).toContain("      passWithNoTests: true,");
  });

  it("fails a member with source and no tests: only an empty member passes with none", () => {
    const withSource = emitToolConfigs(LOYALTY_KIT_IR, { entries: [], registrations: false });
    const vitest = withSource.find((file) => file.path === ".stackra/vitest.config.ts")?.content;
    expect(vitest).not.toContain("passWithNoTests");
  });

  it("runs a package's generated migration check in its unit tier, never a service's (STA-1689)", () => {
    expect(vitestConfigOf(LOYALTY_KIT_IR)).toContain('".stackra/tests/**/*.test.{ts,tsx}"');
    expect(vitestConfigOf(BILLING_IR)).not.toContain(".stackra/tests");
  });

  it("loads the registrations, the wiring and the factory partners in the setup", () => {
    const setup = content(".stackra/vitest.setup.ts");
    expect(setup).toContain('import "#stackra/registrations";');
    expect(setup).toContain(
      'import { markMemberSchemasLoaded, registerWiring } from "@stackra/container/testing";',
    );
    expect(setup).toContain('import { registerModelPartners } from "@stackra/database";');
    expect(setup).toContain("registerWiring(wiring);");
    // compile() would otherwise import the schemas again from node_modules.
    expect(setup).toContain("markMemberSchemasLoaded();");
    // Each schemas file is imported by the setup, which Vite transforms; loadMemberSchemas, imported from
    // node_modules, would load them through Node (STA-2032).
    expect(schemaModules(BILLING_IR).length).toBeGreaterThan(0);
    for (const module of schemaModules(BILLING_IR))
      expect(setup).toContain(`import "./gen/schemas/${module}.ts";`);
    expect(setup).not.toContain("loadMemberSchemas");
    expect(setup).not.toContain("import.meta.url");
    expect(setup).toContain("registerModelPartners([\n  [InvoiceFactory, Invoice],\n]);");
  });

  it("registers the constructor tokens of each seeder that injects, for .seed() (STA-1698)", () => {
    const ir = {
      ...BILLING_IR,
      classes: [
        ...BILLING_IR.classes,
        plansSeeder("PlansMinimalSeeder", [
          {
            class: { name: "Plan", from: "#modules/plans/models/plan.model" },
            of: { name: "repositoryOf", from: "@stackra/database" },
          },
        ]),
        plansSeeder("PlansDemoSeeder", []),
      ],
    };
    const setup =
      emitToolConfigs(ir, { entries: [], registrations: false }).find(
        (file) => file.path === ".stackra/vitest.setup.ts",
      )?.content ?? "";
    expect(setup).toContain('import { registerSeederDeps } from "@stackra/database/testing";');
    expect(setup).toContain(
      'import { registerModelPartners, repositoryOf } from "@stackra/database";',
    );
    expect(setup).toContain('import { Plan } from "#modules/plans/models/plan.model";');
    expect(setup).toContain(
      "registerSeederDeps([\n  [PlansMinimalSeeder, [repositoryOf(Plan)]],\n]);",
    );
    // A seeder that injects nothing is built without arguments, so it needs no row.
    expect(setup).not.toContain("PlansDemoSeeder");
    // No row for a member off @stackra/database.
    expect(
      emitToolConfigs({ ...ir, packages: [] }, { entries: [], registrations: false }).find(
        (file) => file.path === ".stackra/vitest.setup.ts",
      )?.content,
    ).not.toContain("registerSeederDeps");
  });

  it("loads the database testing entry only for a member on @stackra/database", () => {
    expect(content(".stackra/vitest.setup.ts")).toContain('import "@stackra/database/testing";');
    const bare = emitToolConfigs(COMMERCE_IR, { entries: [], registrations: false });
    expect(bare[1]?.content).not.toContain("@stackra/database/testing");
    for (const module of schemaModules(COMMERCE_IR))
      expect(bare[1]?.content).toContain(`import "./gen/schemas/${module}.ts";`);
  });

  it("loads the clients testing entry only for a member on @stackra/clients (STA-1297)", () => {
    expect(content(".stackra/vitest.setup.ts")).toContain('import "@stackra/clients/testing";');
    const bare = emitToolConfigs(COMMERCE_IR, { entries: [], registrations: false });
    expect(bare[1]?.content).not.toContain("@stackra/clients/testing");
  });

  it("loads the tenancy testing entry only for a member on @stackra/tenancy", () => {
    const on = emitToolConfigs(
      { ...COMMERCE_IR, packages: ["@stackra/container", "@stackra/tenancy"] },
      { entries: [], registrations: false },
    );
    expect(on[1]?.content).toContain('import "@stackra/tenancy/testing";');
    const bare = emitToolConfigs(COMMERCE_IR, { entries: [], registrations: false });
    expect(bare[1]?.content).not.toContain("@stackra/tenancy/testing");
  });

  it("loads the scope testing entry only for a member on @stackra/scope", () => {
    const on = emitToolConfigs(
      { ...COMMERCE_IR, packages: ["@stackra/container", "@stackra/scope"] },
      { entries: [], registrations: false },
    );
    expect(on[1]?.content).toContain('import "@stackra/scope/testing";');
    const bare = emitToolConfigs(COMMERCE_IR, { entries: [], registrations: false });
    expect(bare[1]?.content).not.toContain("@stackra/scope/testing");
  });

  it("loads the actions testing entry only for a member on @stackra/actions", () => {
    const on = emitToolConfigs(
      { ...COMMERCE_IR, packages: ["@stackra/container", "@stackra/actions"] },
      { entries: [], registrations: false },
    );
    expect(on[1]?.content).toContain('import "@stackra/actions/testing";');
    const bare = emitToolConfigs(COMMERCE_IR, { entries: [], registrations: false });
    expect(bare[1]?.content).not.toContain("@stackra/actions/testing");
  });

  it("loads the workflow testing entry only for a member on @stackra/workflow", () => {
    const on = emitToolConfigs(
      { ...COMMERCE_IR, packages: ["@stackra/container", "@stackra/workflow"] },
      { entries: [], registrations: false },
    );
    expect(on[1]?.content).toContain('import "@stackra/workflow/testing";');
    const bare = emitToolConfigs(COMMERCE_IR, { entries: [], registrations: false });
    expect(bare[1]?.content).not.toContain("@stackra/workflow/testing");
  });

  it("writes a container-free setup for a member off @stackra/container, and the container one otherwise", () => {
    const testing = {
      ...COMMERCE_IR,
      package: "@stackra/testing",
      packages: ["@stackra/vitest-config"],
    };
    const setup = emitToolConfigs(testing, { entries: [], registrations: false })[1]?.content ?? "";
    // The header names the member itself; no line imports a @stackra package.
    expect(setup).not.toMatch(/(from|import) "@stackra\//);
    expect(setup).not.toContain("registerWiring");
    expect(setup).not.toContain("#stackra/wiring");
    const declared = { ...testing, packages: ["@stackra/container", "@stackra/vitest-config"] };
    expect(emitToolConfigs(declared, { entries: [], registrations: false })[1]?.content).toContain(
      'from "@stackra/container/testing"',
    );
  });

  it("leaves out what a member does not have", () => {
    const bare = emitToolConfigs(COMMERCE_IR, { entries: [], registrations: false });
    expect(bare.map((file) => file.path)).toEqual([
      ".stackra/vitest.config.ts",
      ".stackra/vitest.setup.ts",
      ".stackra/tsconfig.typecheck.json",
      "vitest.config.ts",
    ]);
    expect(bare[1]?.content).not.toContain('import "#stackra/registrations";');
    expect(bare[1]?.content).not.toContain("registerModelPartners");
    expect(emitToolConfigs(WEB_APP_IR, { entries: [], registrations: false })).toEqual([]);
    expect(
      emitToolConfigs({ ...COMMERCE_IR, layout: "worker" }, { entries: [], registrations: false }),
    ).toEqual([]);
  });
});
