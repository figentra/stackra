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
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

describe("emitToolConfigs", () => {
  const files = emitToolConfigs(BILLING_IR, {
    entries: [
      { path: ".stackra/entry/server.ts", content: "" },
      { path: ".stackra/gen/wiring.ts", content: "" },
    ],
    registrations: true,
  });
  const content = (path: string): string => files.find((file) => file.path === path)?.content ?? "";

  it("writes tsdown, vitest and the setup", () => {
    expect(files.map((file) => file.path)).toEqual([
      ".stackra/tsdown.config.ts",
      ".stackra/vitest.config.ts",
      ".stackra/vitest.setup.ts",
      "vitest.config.ts",
    ]);
    expect(content(".stackra/tsdown.config.ts")).toContain(
      'export default {\n  ...library({\n    "server": fileURLToPath(new URL("entry/server.ts", import.meta.url)),\n  }),\n' +
        '  cwd: fileURLToPath(new URL("..", import.meta.url)),\n};',
    );
  });

  it("runs the unit tier on the decorators preset with the coverage gate", () => {
    const vitest = content(".stackra/vitest.config.ts");
    expect(vitest).toContain(
      'import { stackraVitestDecorators } from "@stackra/vitest-config/preset-decorators";',
    );
    expect(vitest).toContain("    withCoverage({");
    expect(vitest).toContain('        exclude: ["**/*.{int,contract,e2e,load}.test.{ts,tsx}"],');
    expect(vitest).toContain('        setupFiles: [".stackra/vitest.setup.ts"],');
    expect(vitest).toContain("        passWithNoTests: true,");
  });

  it("loads the registrations, the wiring and the factory partners in the setup", () => {
    const setup = content(".stackra/vitest.setup.ts");
    expect(setup).toContain('import "#stackra/registrations";');
    expect(setup).toContain(
      'import { loadMemberSchemas, registerWiring } from "@stackra/container/testing";',
    );
    expect(setup).toContain('import { registerModelPartners } from "@stackra/database";');
    expect(setup).toContain("registerWiring(wiring);");
    expect(setup).toContain("await loadMemberSchemas();");
    expect(setup).not.toContain("import.meta.url");
    expect(setup).toContain("registerModelPartners([\n  [InvoiceFactory, Invoice],\n]);");
  });

  it("loads the database testing entry only for a member on @stackra/database", () => {
    expect(content(".stackra/vitest.setup.ts")).toContain('import "@stackra/database/testing";');
    const bare = emitToolConfigs(COMMERCE_IR, { entries: [], registrations: false });
    expect(bare[1]?.content).not.toContain("@stackra/database/testing");
    expect(bare[1]?.content).toContain("await loadMemberSchemas(");
  });

  it("loads the clients testing entry only for a member on @stackra/clients (STA-1297)", () => {
    expect(content(".stackra/vitest.setup.ts")).toContain('import "@stackra/clients/testing";');
    const bare = emitToolConfigs(COMMERCE_IR, { entries: [], registrations: false });
    expect(bare[1]?.content).not.toContain("@stackra/clients/testing");
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
