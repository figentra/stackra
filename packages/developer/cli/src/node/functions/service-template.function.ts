/**
 * Stackra file contract:
 * Purpose: `serviceTemplate(options)`, the files of a new service member (`options.packageName`: `@figentra/service-
 *          <name>`, `@figentra/<product>-service-<name>` or `@<scope>/service-<name>`) in the shape of stackra/template's
 *          services: package.json (the `#src`, `#modules`, `#config`, `#contracts`, `#assets` and `#stackra` imports,
 *          the `./assets/*` export, `@stackra/app` and `@stackra/container` for the generated server entry and
 *          Encore app, the other `@stackra/*` at `options.stackraVersion`, scripts that call `stackra <task>`),
 *          tsconfig.json (the `service` preset), turbo.jsonc, `stackra.config.ts` with one `defineService({ area })`,
 *          `runway.yaml` (version 3, nothing required yet), `assets/.gitkeep`, a `.gitignore` holding the four lines
 *          `encore run` would otherwise append (so it never leaves an untracked or changed file), README.md, AGENTS.md
 *          and CHANGELOG.md, and one passing test of the root module gen writes (`#stackra/module`, booted by
 *          `createTestingModule`). No authored root module: one that states nothing gen cannot derive is refused
 *          (`empty_module`, ADR 0305 rule 15). `encore.dev` is a literal version (`options.encoreVersion`, else
 *          `ENCORE_VERSION`), since gen writes an Encore service declaration for every service, and the package.json
 *          has no `"sideEffects": false`: the generated Encore files import `./database` for its side effects, which
 *          that flag lets Encore's bundler drop (STA-2794). With `data`: the database test peers, `@stackra/testing`,
 *          `@stackra/console` and zod (the console entry and schemas gen writes), `test:int`, and one example module
 *          `src/modules/notes/` (a model, its migration, a unit test on PGlite and one `.int.test.ts`). No `main.ts`,
 *          Encore file or tool config: gen derives and writes them, the vitest configs (unit and int) included.
 * Boundary: pure; returns text and writes nothing. The area is the author's choice, passed in, never defaulted.
 *           Every `src/` file is create-only: `NEW_COMMAND` skips them under `--over`, so modules, an authored root
 *           module and tests are never touched.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R12); ADR 0295 (decisions 1, 5 and 9); ADR 0296 (decision 1: runway v3); ADR
 *                     0305 (rule 15); ADR 0091 and 0124 (Encore is generated); ADR 0282 (consequences); ADR 0349
 *                     (decision 2: product package names); STA-1210; STA-2794.
 */
import { npmMetadataFor, turboTagsFor } from "@stackra/repo-checks/node";

import { ENCORE_VERSION } from "#node/constants/encore-version.constant";
import { serviceExampleModule } from "#node/functions/service-example-module.function";
import type { TemplateFile } from "#node/types/template-file.type";
import type { TemplateOptions } from "#node/types/template-options.type";

/** The `imports` patterns of one alias folder. */
function aliasOf(folder: string): readonly string[] {
  return [`./${folder}/*`, `./${folder}/*.ts`, `./${folder}/*.tsx`, `./${folder}/*/index.ts`];
}

/**
 * The test of the root module: the `<Name>Module` gen writes (`#stackra/module`, since the service authors none)
 * compiles under `createTestingModule`. `stackra test` runs gen first, so the module is on disk.
 */
function rootModuleTest({ pascal, packageName }: TemplateOptions): string {
  return [
    "/**",
    " * Stackra file contract:",
    ` * Purpose: proves the root module of ${packageName}, which gen writes as \`#stackra/module\`, compiles under`,
    " *          `createTestingModule`.",
    " * Boundary: unit tier; boots the module with the wiring gen registers in `.stackra/vitest.setup.ts`. An authored",
    " *           root module (`src/<name>.module.ts`, for `exports` or `wrap`) replaces the generated one: import it",
    " *           from `#src/` then.",
    " * Runtime: node (vitest)",
    " * Governing contract: ADR 0022 (test placement); ADR 0263 (decision 12: testing modules); ADR 0305 (rule 15).",
    " */",
    'import { createTestingModule } from "@stackra/container/testing";',
    'import { describe, expect, it } from "vitest";',
    "",
    `import { ${pascal}Module } from "#stackra/module";`,
    "",
    `describe(${pascal}Module, () => {`,
    '  it("compiles", async () => {',
    `    const app = await createTestingModule(${pascal}Module).compile();`,
    `    expect(app.modules.some((record) => record.type === ${pascal}Module)).toBe(true);`,
    "    await app.close();",
    "  });",
    "});",
    "",
  ].join("\n");
}

/**
 * The files of a new service.
 *
 * @param options - the checked name, description, package name, `@stackra/*` version form and area.
 * @example
 * serviceTemplate({ name: "orders", pascal: "Orders", description: "Orders.", area: "App",
 *   packageName: "@figentra/commerce-service-orders", stackraVersion: "catalog:stackra" });
 */
export function serviceTemplate(options: TemplateOptions): readonly TemplateFile[] {
  const { name, description, packageName, stackraVersion } = options;
  const data = options.data === true;
  const area = options.area ?? "";
  const tasks = ["dev", "build", "typecheck", "lint", "test"];
  const { repository, homepage, bugs, author, engines } = npmMetadataFor(`services/${name}`);
  // Only the Stackra repository itself depends on `workspace:*`; a product service links nothing of ours.
  const inStackra = stackraVersion === "workspace:*";
  const stackra = {
    kind: "package",
    tier: "service",
    runtimes: ["node"],
    ...(options.summary !== undefined && { summary: options.summary }),
  };
  const packageJson = {
    name: packageName,
    version: "0.0.0",
    private: true,
    description,
    keywords: ["stackra"],
    ...(inStackra && { homepage, bugs }),
    license: "UNLICENSED",
    ...(inStackra && { author, repository }),
    type: "module",
    // No `"sideEffects": false`: the generated Encore files (`stackra-encore/<member>/*.ts`) import `./database` for
    // its side effects, which that flag lets Encore's bundler drop (gen refuses it, `encore_side_effects_dropped`).
    imports: {
      "#src/*": aliasOf("src"),
      "#config/*": aliasOf("src/config"),
      "#contracts/*": aliasOf("src/contracts"),
      "#modules/*": aliasOf("src/modules"),
      "#assets/*": "./assets/*",
      "#stackra/*": aliasOf(".stackra/gen"),
    },
    exports: { "./assets/*": "./assets/*" },
    scripts: {
      ...Object.fromEntries(tasks.map((task) => [task, `stackra ${task}`])),
      ...(data && { "test:int": "stackra test --tier int" }),
      format: "oxfmt --write .",
      "format:check": "oxfmt --check .",
      clean: "rm -rf dist coverage .turbo .stackra",
    },
    // Gen refuses an undeclared generated dependency: the server entry (`.stackra/entry/server.ts`) imports
    // `@stackra/app`, the Encore app (`stackra-encore/<member>/http.ts`) imports `@stackra/container`, and the Encore
    // service declaration (`stackra-encore/<member>/encore.service.ts`) imports `encore.dev`, pinned literally because
    // Encore rewrites any other spec, `catalog:` included (ADR 0091).
    dependencies: {
      "@stackra/app": stackraVersion,
      "@stackra/container": stackraVersion,
      "@stackra/contracts": stackraVersion,
      // With `data`: the console entry gen writes for @stackra/database's commands imports `@stackra/console`, and
      // the schemas it compiles from the example module's shapes import zod (`schema_dependency_missing` without it).
      ...(data && {
        "@stackra/console": stackraVersion,
        "@stackra/database": stackraVersion,
        "@stackra/model": stackraVersion,
        "@stackra/validation": stackraVersion,
      }),
      "encore.dev": options.encoreVersion ?? ENCORE_VERSION,
      ...(data && { zod: "catalog:" }),
    },
    devDependencies: {
      "@stackra/cli": stackraVersion,
      "@stackra/tsdown-config": stackraVersion,
      "@stackra/typescript-config": stackraVersion,
      "@stackra/vitest-config": stackraVersion,
      "@types/node": "catalog:",
      oxfmt: "catalog:quality",
      oxlint: "catalog:quality",
      tsdown: "catalog:build",
      typescript: "catalog:build",
      vitest: "catalog:quality",
      // The database testing entry loads these on first use (optional peers of @stackra/database, ADR 0269).
      ...(data && {
        "@electric-sql/pglite": "catalog:",
        "@electric-sql/pglite-pgvector": "catalog:",
        "@faker-js/faker": "catalog:",
        "@mikro-orm/pglite": "catalog:",
        "@stackra/events": stackraVersion,
        "@stackra/testing": stackraVersion,
        "@testcontainers/postgresql": "catalog:",
        testcontainers: "catalog:",
      }),
    },
    engines,
    stackra,
  };
  return [
    { path: "package.json", content: `${JSON.stringify(packageJson, null, 2)}\n` },
    {
      path: "tsconfig.json",
      content: [
        "// TypeScript project for this member: extends exactly one @stackra/typescript-config preset and sets nothing else.",
        "// Owner: release-operations · Secrets: forbidden",
        '{ "extends": "@stackra/typescript-config/service" }',
        "",
      ].join("\n"),
    },
    {
      path: "turbo.jsonc",
      content: [
        "// Turborepo package configuration: extends the root turbo.jsonc and declares this member's tags.",
        "// Owner: release-operations · Secrets: forbidden",
        `{ "$schema": "https://turborepo.dev/schema.json", "extends": ["//"], "tags": ${JSON.stringify(turboTagsFor(stackra))} }`,
        "",
      ].join("\n"),
    },
    {
      path: "stackra.config.ts",
      content: [
        "/**",
        " * Stackra file contract:",
        ` * Purpose: the member definition of ${packageName}: static data that gen reads from the syntax tree`,
        " *          without running it. The member key is derived from the folder name; there is no key option.",
        " * Boundary: data only; no call other than `defineService` and no environment read.",
        " * Runtime: node",
        " * Governing contract: ADR 0295 (decisions 1 and 9); ADR 0294 (rule R12); ADR 0082 (API areas).",
        " */",
        'import { ApiArea, defineService } from "@stackra/contracts";',
        "",
        "/** Read by `stackra gen` and `stackra validate`. */",
        `export default defineService({ area: ApiArea.${area} });`,
        "",
      ].join("\n"),
    },
    {
      path: "runway.yaml",
      content: [
        "# Stackra file contract:",
        `# Purpose: what ${packageName} needs at runtime beyond what gen derives (runway v3, ADR 0296).`,
        "# Boundary: names and sizes only; secret values come from figentra/secrets through runway (ADR 0525).",
        "# Governing contract: ADR 0296 (decision 1).",
        "version: 3",
        "requires: {}",
        "secrets: []",
        "environments: {}",
        "",
      ].join("\n"),
    },
    { path: "assets/.gitkeep", content: "" },
    {
      // `encore run` appends each of these lines a member's `.gitignore` lacks, writing the file when there is none;
      // with all four here it leaves the file alone, so `git status` stays clean after `stackra dev` (STA-2794).
      path: ".gitignore",
      content: [
        "# What `encore run` generates in this service (the Encore app root). Encore appends any of these lines that is",
        "# missing, so all four stay here; the rest of the generated output is ignored by the repository's .gitignore.",
        "encore.gen.go",
        "encore.gen.cue",
        "/.encore",
        "/encore.gen",
        "",
      ].join("\n"),
    },
    { path: `src/__tests__/${name}.module.test.ts`, content: rootModuleTest(options) },
    ...(data ? serviceExampleModule(options) : []),
    {
      path: "README.md",
      content: [
        `# ${packageName}`,
        "",
        description,
        "",
        "A plain-TypeScript service member (`tier:service`) in the programming model v3 shape (ADR 0294, 0295). Feature",
        "modules go in `src/modules/<key>/` (imported as `#modules/<key>/...`, the rest of `src/` as `#src/...`), files",
        "under `assets/` are `#assets/...` and the `./assets/*` export. `stackra gen` writes the wiring, the server entry",
        "and the Encore app into `.stackra/`. Nobody writes `main.ts`.",
        "",
        "First run: `pnpm install`, `stackra gen`, `stackra test`.",
        ...(data
          ? [
              "",
              "`src/modules/notes/` is a model with its migration and two tests: a unit test on PGlite and an integration",
              "test (`pnpm test:int`, needs Docker). It is not tenant-owned; read the tenancy rule before the first",
              "tenant-owned table.",
            ]
          : []),
        "",
      ].join("\n"),
    },
    {
      path: "AGENTS.md",
      content: [
        `# AGENTS — ${packageName}`,
        "",
        `${description} Member at \`services/${name}\` (\`tier:service\`), in the programming model v3 shape.`,
        "",
        "## Rules that fail the build",
        "",
        "- No Encore file or import, no `main.ts`, no tool config: gen writes them into `.stackra/`.",
        "- Never import another service; use its generated client or its events.",
        "- A business value (a price, a rate, a country rule) is seed data or a setting, never code.",
        "- Versions are `catalog:<name>` or `workspace:*` only.",
        "",
        "## PII",
        "",
        "None yet. Revisit when it stores or receives user data.",
        "",
      ].join("\n"),
    },
    {
      path: "CHANGELOG.md",
      content: `# ${packageName}\n\nWritten by Changesets on release; never edited by hand.\n`,
    },
  ];
}
