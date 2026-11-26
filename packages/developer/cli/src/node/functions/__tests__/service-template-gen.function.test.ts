/**
 * Stackra file contract:
 * Purpose: runs gen's member generation (`generate` from `@stackra/gen/node`) over what `serviceTemplate` writes, plain
 *          and `--data`, and expects zero refusals: the template states no root module gen refuses as `empty_module`
 *          (gen writes `#stackra/module`), and declares every package a generated file imports, `encore.dev` (the
 *          Encore service declaration) included, so nothing is `generated_dependency_missing` (STA-2794).
 * Boundary: test only; writes each member under `<cli>/.cache/fixtures/` (gitignored), inside a fixture workspace (its
 *           own `pnpm-workspace.yaml` and a root runway naming the Encore app), and runs gen on it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rule 15: the module is optional); ADR 0091 (decision 2:
 *                     `encore.dev` pinned literally); STA-1296; STA-2794.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { formatGenError } from "@stackra/gen";
import { generate } from "@stackra/gen/node";
import { describe, expect, it } from "@stackra/testing";

import { serviceTemplate } from "#node/functions/service-template.function";

/** The cli package root; fixtures go under its gitignored `.cache/`. */
const CLI_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));

/** This repository's `packages/<category>/<name>` folders by package name: the `@stackra/*` a fixture links. */
const PACKAGES = join(CLI_ROOT, "../..");
const WORKSPACE_PACKAGES = new Map(
  readdirSync(PACKAGES, { withFileTypes: true })
    .filter((category) => category.isDirectory())
    .flatMap((category) =>
      readdirSync(join(PACKAGES, category.name), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .flatMap((entry) => {
          try {
            const folder = join(PACKAGES, category.name, entry.name);
            const { name } = JSON.parse(readFileSync(join(folder, "package.json"), "utf8")) as {
              name: string;
            };
            return [[name, folder] as const];
          } catch {
            return [];
          }
        }),
    ),
);

/** Writes a fixture workspace holding `serviceTemplate`'s output at `services/<name>` and returns the member root. */
function writeService(name: string, data: boolean): string {
  const workspace = join(CLI_ROOT, ".cache", "fixtures", `${process.pid}-service-${name}`);
  rmSync(workspace, { recursive: true, force: true });
  const files: Record<string, string> = {
    "pnpm-workspace.yaml": "packages:\n  - services/*\n",
    "runway.yaml": "version: 3\nproviders:\n  encore:\n    app: fixture-app\n",
  };
  for (const file of serviceTemplate({
    name,
    pascal: name.charAt(0).toUpperCase() + name.slice(1),
    description: "Demo.",
    area: "App",
    data,
    packageName: `@fixture/service-${name}`,
    stackraVersion: "catalog:stackra",
  }))
    files[`services/${name}/${file.path}`] = file.content;
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(workspace, path)), { recursive: true });
    writeFileSync(join(workspace, path), content);
  }
  // Each declared `@stackra/*` resolves to this repository's package, as an install of the catalog would give it.
  const pkg = JSON.parse(files[`services/${name}/package.json`] ?? "{}") as {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  mkdirSync(join(workspace, "node_modules/@stackra"), { recursive: true });
  for (const dependency of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) {
    const folder = WORKSPACE_PACKAGES.get(dependency);
    if (dependency.startsWith("@stackra/") && folder !== undefined)
      symlinkSync(folder, join(workspace, "node_modules", dependency), "dir");
  }
  return join(workspace, "services", name);
}

describe("serviceTemplate under gen", () => {
  it.each([
    ["plain", "orders", false],
    ["--data", "ledger", true],
  ])("a %s service passes gen with no refusal", async (_, name, data) => {
    const result = await generate(writeService(name, data));
    expect(result.errors.map(formatGenError)).toEqual([]);
  });
});
