/**
 * Stackra file contract:
 * Purpose: `packageTemplate(options)`, the files of a new `@stackra/<name>` package in the programming model v3
 *          shape: package.json (scripts that call `stackra <task>`), tsconfig.json, turbo.jsonc, `stackra.config.ts`
 *          with one `definePackage({})`, README.md, AGENTS.md and CHANGELOG.md. No root module, entry barrel or tool
 *          config: a member with no root module is one module keyed by its folder, gen writes the barrels and the
 *          tool configs into `.stackra/`, and an entry is exported with its first file.
 * Boundary: pure; returns text and writes nothing.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R12, decision 15); ADR 0295 (decisions 1 and 5); ADR 0305 (rule 15: the root
 *                     module is optional); ADR 0282 (consequences: `new` moves into the CLI).
 */
import type { TemplateFile } from "#node/types/template-file.type";
import type { TemplateOptions } from "#node/types/template-options.type";

/**
 * The files of a new package.
 *
 * @param options - the checked name, description and category.
 * @example
 * packageTemplate({ name: "loyalty-kit", pascal: "LoyaltyKit", description: "Loyalty points.", category: "commerce" });
 */
export function packageTemplate(options: TemplateOptions): readonly TemplateFile[] {
  const { name, description } = options;
  const category = options.category ?? "";
  const tasks = ["build", "typecheck", "lint", "test"];
  const packageJson = {
    name: `@stackra/${name}`,
    version: "0.0.0",
    private: true,
    description,
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/figentra/stackra.git",
      directory: `packages/${category}/${name}`,
    },
    files: [
      "dist",
      "src",
      "assets",
      "stackra.manifest.json",
      "README.md",
      "CHANGELOG.md",
      "LICENSE",
    ],
    type: "module",
    sideEffects: false,
    exports: {},
    imports: {},
    publishConfig: { access: "public", provenance: true, registry: "https://registry.npmjs.org/" },
    scripts: {
      ...Object.fromEntries(tasks.map((task) => [task, `stackra ${task}`])),
      format: "oxfmt --write .",
      "format:check": "oxfmt --check .",
      clean: "rm -rf dist coverage .turbo .stackra",
    },
    dependencies: { "@stackra/contracts": "workspace:*" },
    devDependencies: {
      "@stackra/cli": "workspace:*",
      "@stackra/tsdown-config": "workspace:*",
      "@stackra/typescript-config": "workspace:*",
      "@stackra/vitest-config": "workspace:*",
      "@types/node": "catalog:",
      "@vitest/coverage-v8": "catalog:quality",
      oxfmt: "catalog:quality",
      oxlint: "catalog:quality",
      tsdown: "catalog:build",
      typescript: "catalog:build",
      vitest: "catalog:quality",
    },
  };
  return [
    { path: "package.json", content: `${JSON.stringify(packageJson, null, 2)}\n` },
    {
      path: "tsconfig.json",
      content: [
        "// TypeScript project for this member: extends exactly one @stackra/typescript-config preset and sets nothing else.",
        "// Owner: release-operations · Secrets: forbidden",
        '{ "extends": "@stackra/typescript-config/decorators" }',
        "",
      ].join("\n"),
    },
    {
      path: "turbo.jsonc",
      content: [
        "// Turborepo package configuration: extends the root turbo.jsonc and declares this member's one tier tag.",
        "// Owner: release-operations · Secrets: forbidden",
        '{ "$schema": "https://turborepo.dev/schema.json", "extends": ["//"], "tags": ["tier:lib"] }',
        "",
      ].join("\n"),
    },
    {
      path: "stackra.config.ts",
      content: [
        "/**",
        " * Stackra file contract:",
        ` * Purpose: the member definition of @stackra/${name}: static data that gen reads from the syntax tree without`,
        " *          running it. The member key is derived from the folder name; there is no key option.",
        " * Boundary: data only; no call other than `definePackage` and no environment read.",
        " * Runtime: node",
        " * Governing contract: ADR 0295 (decision 1); ADR 0294 (rule R12).",
        " */",
        'import { definePackage } from "@stackra/contracts";',
        "",
        "/** Read by `stackra gen` and `stackra validate`. A package states nothing gen can derive. */",
        "export default definePackage({});",
        "",
      ].join("\n"),
    },
    {
      path: "README.md",
      content: [
        `# @stackra/${name}`,
        "",
        description,
        "",
        `**Tier:** \`tier:lib\` (\`packages/${category}/${name}\`), in the programming model v3 shape (ADR 0294, 0295).`,
        "",
        "## Entries",
        "",
        "`.` (`src/core/`, `src/config/`), `./contracts`, `./node`, `./react`, `./native` and `./testing`. An entry is",
        "exported with its first file; `stackra gen` writes the barrels and the tool configs into `.stackra/`.",
        "",
        "## Tasks",
        "",
        "`build`, `typecheck`, `lint` and `test` run `stackra <task>`, which runs gen and then the tool.",
        "",
      ].join("\n"),
    },
    {
      path: "AGENTS.md",
      content: [
        `# AGENTS — @stackra/${name}`,
        "",
        `${description} Member at \`packages/${category}/${name}\` (\`tier:lib\`), in the programming model v3 shape`,
        "(ADR 0294, 0295, 0305).",
        "",
        "## Where code goes",
        "",
        "| You are writing…                     | It goes in…                                          |",
        "| ------------------------------------ | ---------------------------------------------------- |",
        "| A port, a public enum or type        | `src/contracts/{ports,enums,types}/`                 |",
        "| Isomorphic code                      | `src/core/<group>/`                                  |",
        "| Actions, queries, models, listeners  | `src/node/<group>/`                                  |",
        "| Fakes and matchers for consumers     | `src/testing/{fakes,matchers}/`                      |",
        "| A test                               | `__tests__/<name>.<kind>.test.ts` beside its subject |",
        "",
        "## Rules that fail the build",
        "",
        "- Never write `main.ts`, an entry barrel or a tool config; gen writes them.",
        "- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.",
        "- Versions are `catalog:<name>` or `workspace:*` only.",
        "",
        "## PII",
        "",
        "None yet.",
        "",
      ].join("\n"),
    },
    {
      path: "CHANGELOG.md",
      content: `# @stackra/${name}\n\nWritten by Changesets on release; never edited by hand.\n`,
    },
  ];
}
