/**
 * Stackra file contract:
 * Purpose: proves the generated app is standalone (no `.stackra/`, no token in `.npmrc`), registers its command
 *          explicitly, pins its tools, and carries tests for help, a run, a prompt, NO_COLOR and --json.
 * Boundary: unit test of the templates; nothing is written.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-031; ADR 0022 (test placement).
 */
// @covers sta-1730:FR-031
import { APP_VERSIONS } from "#node/constants/app-versions.constant";
import { appFiles } from "#node/functions/app-files.function";

const files = appFiles({
  name: "acme-cli",
  bin: "acme",
  accent: "#1E88E5",
  stackra: { "@stackra/console": "0.1.0" },
  override: false,
});

describe("appFiles", () => {
  it("writes a standalone app with its command registered explicitly", () => {
    expect(Object.keys(files).toSorted()).toEqual([
      ".gitignore",
      ".npmrc",
      "README.md",
      "package.json",
      "src/commands/__tests__/greet.command.test.ts",
      "src/commands/greet.command.ts",
      "src/main.ts",
      "src/theme.ts",
      "tsconfig.build.json",
      "tsconfig.json",
      "vitest.config.ts",
    ]);
    expect(Object.keys(files).some((path) => path.includes(".stackra"))).toBe(false);
    expect(files["src/main.ts"]).toContain("commands: [GreetCommand]");
    expect(files["src/theme.ts"]).toContain('accent: "#1E88E5"');
  });

  it("names the Stackra registry for the scope and writes no token", () => {
    expect(files[".npmrc"]).toBe("@stackra:registry=https://npm.stackra.figentra.com/\n");
    expect(files[".npmrc"]).not.toMatch(/_auth|token/i);
  });

  it("pins its tools and its Stackra packages, with overrides only for tarball runs", () => {
    const pkg = JSON.parse(files["package.json"] ?? "{}") as Record<
      string,
      Record<string, unknown>
    >;
    expect(pkg["bin"]).toEqual({ acme: "./dist/main.js" });
    expect(pkg["devDependencies"]).toEqual(APP_VERSIONS);
    expect(pkg["dependencies"]?.["@stackra/console"]).toBe("0.1.0");
    expect(pkg["pnpm"]).toBeUndefined();
    const tarball = appFiles({
      name: "x",
      bin: "x",
      accent: "#000000",
      stackra: { "@stackra/console": "file:/t.tgz" },
      override: true,
    });
    expect(JSON.parse(tarball["package.json"] ?? "{}").pnpm.overrides).toEqual({
      "@stackra/console": "file:/t.tgz",
    });
  });

  it("tests help, a run, a prompt, NO_COLOR and --json", () => {
    const test = files["src/commands/__tests__/greet.command.test.ts"] ?? "";
    for (const check of ['"--help"', '"Ada"', "answers:", "NO_COLOR", '"--json"'])
      expect(test).toContain(check);
  });
});
