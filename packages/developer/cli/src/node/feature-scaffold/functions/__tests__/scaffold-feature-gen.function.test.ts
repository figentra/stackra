/**
 * Stackra file contract:
 * Purpose: runs gen's member generation (`generate` from `@stackra/gen/node`, strict, so the staged refusals block)
 *          over a service built only with the feature kinds of `stackra new` — a module with a fielded model, a second
 *          model, create, update, delete and a custom-verb action, list and get queries, and an alter migration — and
 *          expects zero refusals, in a plain service and in one that runs `@stackra/tenancy` (tenant-owned models).
 *          The files come out formatted by the workspace's oxfmt.
 * Boundary: test only; writes each service under `<cli>/.cache/fixtures/` (gitignored) inside a fixture workspace (its
 *           own `pnpm-workspace.yaml`, a root runway naming the Encore app, this repository's `@stackra/*` packages
 *           and oxfmt linked into its `node_modules`), and runs gen on it. The service starts from `serviceTemplate`
 *           without its root module and with `encore.dev`, as STA-2794 writes it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294; ADR 0305; ADR 0239; STA-2096 and STA-2808 (strict gen);
 *                     STA-2855.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { formatGenError } from "@stackra/gen";
import { generate } from "@stackra/gen/node";
import { describe, expect, it } from "@stackra/testing";

import { scaffoldFeature } from "#node/feature-scaffold/functions/scaffold-feature.function";
import type { FeatureOptions } from "#node/feature-scaffold/types/feature-options.type";
import { serviceTemplate } from "#node/functions/service-template.function";

/** The cli package root; fixtures go under its gitignored `.cache/`. */
const CLI_ROOT = fileURLToPath(new URL("../../../../../", import.meta.url));

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

/** Writes a fixture workspace with a bare service at `services/<name>` and returns the service folder. */
function writeService(name: string, tenancy: boolean): string {
  const workspace = join(CLI_ROOT, ".cache", "fixtures", `${process.pid}-feature-${name}`);
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
    packageName: `@fixture/service-${name}`,
    stackraVersion: "catalog:stackra",
  }))
    // The root module states nothing gen cannot derive (ADR 0305 rule 15), so the service goes without it.
    if (!file.path.includes(`${name}.module`))
      files[`services/${name}/${file.path}`] = file.content;
  const pkg = JSON.parse(files[`services/${name}/package.json`] ?? "{}") as {
    dependencies: Record<string, string>;
  };
  pkg.dependencies["encore.dev"] = "1.58.8";
  if (tenancy) pkg.dependencies["@stackra/tenancy"] = "catalog:stackra";
  files[`services/${name}/package.json`] = `${JSON.stringify(pkg, null, 2)}\n`;
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(workspace, path)), { recursive: true });
    writeFileSync(join(workspace, path), content);
  }
  mkdirSync(join(workspace, "node_modules/.bin"), { recursive: true });
  symlinkSync(
    join(CLI_ROOT, "../../../node_modules/.bin/oxfmt"),
    join(workspace, "node_modules/.bin/oxfmt"),
  );
  return join(workspace, "services", name);
}

/** Links each `@stackra/*` the service declares to this repository's package, as an install would give it. */
function linkPackages(member: string): void {
  const workspace = join(member, "../..");
  const pkg = JSON.parse(readFileSync(join(member, "package.json"), "utf8")) as {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  mkdirSync(join(workspace, "node_modules/@stackra"), { recursive: true });
  for (const dependency of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) {
    const folder = WORKSPACE_PACKAGES.get(dependency);
    if (dependency.startsWith("@stackra/") && folder !== undefined)
      symlinkSync(folder, join(workspace, "node_modules", dependency), "dir");
  }
}

/** Every piece of a feature, in the order a developer adds them. */
const PIECES: readonly Omit<FeatureOptions, "cwd">[] = [
  {
    kind: "module",
    name: "catalog",
    model: "product",
    fields: "title:string,notes:text?,quantity:int,active:bool,dueAt:timestamp?",
  },
  { kind: "model", name: "price-list", module: "catalog", fields: "label:string" },
  { kind: "action", name: "create-product", module: "catalog" },
  { kind: "action", name: "update-product", module: "catalog" },
  { kind: "action", name: "delete-product", module: "catalog" },
  { kind: "action", name: "archive-product", module: "catalog" },
  { kind: "query", name: "list-products", module: "catalog" },
  { kind: "query", name: "get-product", module: "catalog" },
  { kind: "query", name: "list-price-lists", module: "catalog" },
  { kind: "migration", name: "add-sku-to-products", module: "catalog", fields: "sku:string?" },
];

describe("scaffoldFeature under gen", () => {
  it.each([
    ["plain", "shelf", false],
    ["tenant-owned", "pantry", true],
  ])(
    "a %s service built with the feature kinds passes strict gen",
    { timeout: 120_000 },
    async (_, name, tenancy) => {
      const member = writeService(name, tenancy);
      for (const piece of PIECES) {
        const made = scaffoldFeature({ ...piece, cwd: member });
        // The workspace's oxfmt ran, so no note asks for it.
        expect(made.notes.filter((note) => note.includes("oxfmt"))).toEqual([]);
      }
      linkPackages(member);
      const model = readFileSync(
        join(member, "src/modules/catalog/models/product.model.ts"),
        "utf8",
      );
      expect(model.includes("BelongsToTenant")).toBe(tenancy);

      const result = await generate(member, { strict: true });

      expect(result.errors.map(formatGenError)).toEqual([]);
    },
  );
});
