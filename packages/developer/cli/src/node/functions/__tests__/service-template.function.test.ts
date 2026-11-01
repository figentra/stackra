/**
 * Stackra file contract:
 * Purpose: unit tests of `serviceTemplate`: the file list of a plain service (root module, its `createTestingModule`
 *          test, no tool config, no `test:int`) and of a `--data` one (the example module with model, migration, unit
 *          and `.int` tests, the database test peers, `@stackra/testing` and `test:int`), and `--summary` landing in
 *          `stackra.summary` only when given.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (rule R12); ADR 0295 (no authored tool config); STA-1819.
 */
import { describe, expect, it } from "@stackra/testing";

import { serviceTemplate } from "#node/functions/service-template.function";

const OPTIONS = {
  name: "demo",
  pascal: "Demo",
  description: "Demo.",
  area: "App",
  packageName: "@figentra/service-demo",
  stackraVersion: "workspace:*",
};

const paths = (data: boolean) => serviceTemplate({ ...OPTIONS, data }).map((file) => file.path);

const content = (data: boolean, path: string): string =>
  serviceTemplate({ ...OPTIONS, data }).find((file) => file.path === path)?.content ?? "";

const manifest = (data: boolean) =>
  JSON.parse(content(data, "package.json")) as {
    scripts: Record<string, string>;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    stackra: Record<string, unknown>;
  };

describe("serviceTemplate", () => {
  it("writes the member files, the root module and its test", () => {
    expect(paths(false)).toEqual([
      "package.json",
      "tsconfig.json",
      "turbo.jsonc",
      "stackra.config.ts",
      "runway.yaml",
      "assets/.gitkeep",
      "src/demo.module.ts",
      "src/__tests__/demo.module.test.ts",
      "README.md",
      "AGENTS.md",
      "CHANGELOG.md",
    ]);
    expect(content(false, "src/demo.module.ts")).toContain(
      "export class DemoModule extends Module({}) {}",
    );
    const test = content(false, "src/__tests__/demo.module.test.ts");
    expect(test).toContain('from "@stackra/container/testing"');
    expect(test).toContain("await createTestingModule(DemoModule).compile()");
  });

  it("writes no tool config and no test:int without --data", () => {
    expect(paths(false).filter((path) => /(vitest|tsdown)[^/]*config/.test(path))).toEqual([]);
    expect(manifest(false).scripts["test:int"]).toBeUndefined();
    expect(manifest(false).devDependencies["testcontainers"]).toBeUndefined();
  });

  it("adds the example module, the test peers and test:int with --data", () => {
    expect(paths(true)).toEqual(
      expect.arrayContaining([
        "src/demo.module.ts",
        "src/modules/notes/models/note.model.ts",
        "src/modules/notes/database/migrations/0001-create-notes.migration.ts",
        "src/modules/notes/database/migrations/__tests__/0001-create-notes.migration.test.ts",
        "src/modules/notes/database/migrations/__tests__/0001-create-notes.migration.int.test.ts",
      ]),
    );
    expect(paths(true).filter((path) => /(vitest|tsdown)[^/]*config/.test(path))).toEqual([]);
    const pkg = manifest(true);
    expect(pkg.scripts["test:int"]).toBe("stackra test --tier int");
    expect(Object.keys(pkg.devDependencies)).toEqual(
      expect.arrayContaining([
        "@electric-sql/pglite",
        "@electric-sql/pglite-pgvector",
        "@mikro-orm/pglite",
        "@faker-js/faker",
        "@stackra/testing",
        "testcontainers",
      ]),
    );
    expect(Object.keys(pkg.dependencies)).toEqual(
      expect.arrayContaining(["@stackra/database", "@stackra/model", "@stackra/validation"]),
    );
  });

  it("takes the summary only when given", () => {
    expect(manifest(false).stackra["summary"]).toBeUndefined();
    const summary = serviceTemplate({ ...OPTIONS, summary: "Reach for it." }).find(
      (file) => file.path === "package.json",
    )?.content;
    expect(JSON.parse(summary ?? "{}")).toMatchObject({ stackra: { summary: "Reach for it." } });
  });
});
