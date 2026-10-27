/**
 * Stackra file contract:
 * Purpose: `packageTemplate(options)`, the files of a new package (`options.packageName`: `@stackra/<name>`,
 *          `@figentra/<product>-<name>` or `@<scope>/<name>`) in the programming model v3 shape of stackra/template's
 *          packages: package.json (the `#src` and `#assets` imports, the `./assets/*` export, `@stackra/*` at
 *          `options.stackraVersion`, scripts that call `stackra <task>`), tsconfig.json, turbo.jsonc,
 *          `stackra.config.ts` with one `definePackage({})`, `assets/.gitkeep`, README.md, AGENTS.md and CHANGELOG.md.
 *          Only a `@stackra/*` package gets the MIT licence, the repository link and the npmjs `publishConfig`; a
 *          product or scoped package is `UNLICENSED` and publishes nowhere until its product decides (ADR 0349 d4).
 *          No root module, entry barrel or tool config: a member with no root module is one module keyed by its
 *          folder, gen writes the barrels and the tool configs into `.stackra/`, and an entry is exported with its
 *          first file.
 * Boundary: pure; returns text and writes nothing. Nothing under `src/` is written.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R12, decision 15); ADR 0295 (decisions 1 and 5); ADR 0305 (rule 15: the root
 *                     module is optional); ADR 0282 (consequences: `new` moves into the CLI); ADR 0349 (decisions 2 and 4); STA-1210.
 */
import { Enum } from "@stackra/contracts";
import { npmMetadataFor, turboTagsFor } from "@stackra/repo-checks/node";
import { StackraCategory } from "@stackra/skills/contracts";

import type { TemplateFile } from "#node/types/template-file.type";
import type { TemplateOptions } from "#node/types/template-options.type";

/**
 * The files of a new package.
 *
 * @param options - the checked name, description, package name, `@stackra/*` version form and category.
 * @example
 * packageTemplate({ name: "loyalty-kit", pascal: "LoyaltyKit", description: "Loyalty points.", category: "commerce",
 *   packageName: "@stackra/loyalty-kit", stackraVersion: "workspace:*" });
 */
export function packageTemplate(options: TemplateOptions): readonly TemplateFile[] {
  const { name, description, packageName, stackraVersion } = options;
  const framework = packageName.startsWith("@stackra/");
  const category = options.category ?? "";
  const tasks = ["build", "typecheck", "lint", "test"];
  const metadata = npmMetadataFor(`packages/${category}/${name}`);
  // `.` is the first entry and isomorphic; `stackra.runtimes` and the turbo tags grow with the entries added later.
  const stackra = {
    kind: "package",
    tier: "lib",
    ...((Enum.values(StackraCategory) as string[]).includes(category) && { category }),
    runtimes: ["isomorphic"],
    ...(options.summary !== undefined && { summary: options.summary }),
  };
  const packageJson = {
    name: packageName,
    version: "0.0.0",
    private: true,
    description,
    keywords: ["stackra", category],
    ...(framework && { homepage: metadata.homepage, bugs: metadata.bugs }),
    license: framework ? "MIT" : "UNLICENSED",
    ...(framework && { author: metadata.author }),
    ...(framework && {
      repository: {
        type: "git",
        url: "git+https://github.com/figentra/stackra.git",
        directory: `packages/${category}/${name}`,
      },
    }),
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
    exports: { "./assets/*": "./assets/*" },
    imports: {
      "#src/*": ["./src/*", "./src/*.ts", "./src/*.tsx", "./src/*/index.ts"],
      "#assets/*": "./assets/*",
    },
    ...(framework && {
      publishConfig: {
        access: "public",
        provenance: true,
        registry: "https://registry.npmjs.org/",
      },
    }),
    scripts: {
      ...Object.fromEntries(tasks.map((task) => [task, `stackra ${task}`])),
      format: "oxfmt --write .",
      "format:check": "oxfmt --check .",
      clean: "rm -rf dist coverage .turbo .stackra",
    },
    dependencies: { "@stackra/contracts": stackraVersion },
    devDependencies: {
      "@stackra/cli": stackraVersion,
      "@stackra/tsdown-config": stackraVersion,
      "@stackra/typescript-config": stackraVersion,
      "@stackra/vitest-config": stackraVersion,
      "@types/node": "catalog:",
      "@vitest/coverage-v8": "catalog:quality",
      oxfmt: "catalog:quality",
      oxlint: "catalog:quality",
      tsdown: "catalog:build",
      typescript: "catalog:build",
      vitest: "catalog:quality",
    },
    engines: metadata.engines,
    stackra,
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
        ` * Purpose: the member definition of ${packageName}: static data that gen reads from the syntax tree without`,
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
    { path: "assets/.gitkeep", content: "" },
    {
      path: "README.md",
      content: [
        `# ${packageName}`,
        "",
        description,
        "",
        `**Tier:** \`tier:lib\` (\`packages/${category}/${name}\`), in the programming model v3 shape (ADR 0294, 0295).`,
        "",
        "## Entries",
        "",
        "`.` (`src/core/`, `src/config/`), `./contracts`, `./node`, `./react`, `./native` and `./testing`. An entry is",
        "exported with its first file; `stackra gen` writes the barrels and the tool configs into `.stackra/`. Code",
        "imports its own `src/` as `#src/...`; files under `assets/` are `#assets/...` and the `./assets/*` export.",
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
        `# AGENTS — ${packageName}`,
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
      content: `# ${packageName}\n\nWritten by Changesets on release; never edited by hand.\n`,
    },
  ];
}
