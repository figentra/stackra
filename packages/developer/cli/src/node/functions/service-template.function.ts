/**
 * Stackra file contract:
 * Purpose: `serviceTemplate(options)`, the files of a new `@figentra/service-<name>` in the programming model v3
 *          shape: package.json (the `#modules`, `#config`, `#contracts` and `#stackra` imports; scripts that call
 *          `stackra <task>`), tsconfig.json, turbo.jsonc, `stackra.config.ts` with one `defineService({ area })`,
 *          `runway.yaml` (version 3, nothing required yet), README.md, AGENTS.md and CHANGELOG.md. No root module,
 *          `main.ts`, Encore file or tool config: gen derives and writes them.
 * Boundary: pure; returns text and writes nothing. The area is the author's choice, passed in, never defaulted.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R12); ADR 0295 (decisions 1, 5 and 9); ADR 0296 (decision 1: runway v3); ADR
 *                     0305 (rule 15); ADR 0091 and 0124 (Encore is generated); ADR 0282 (consequences).
 */
import type { TemplateFile } from "#node/types/template-file.type";
import type { TemplateOptions } from "#node/types/template-options.type";

/** The `imports` patterns of one alias folder. */
function aliasOf(folder: string): readonly string[] {
  return [`./${folder}/*`, `./${folder}/*.ts`, `./${folder}/*.tsx`, `./${folder}/*/index.ts`];
}

/**
 * The files of a new service.
 *
 * @param options - the checked name, description and area.
 * @example
 * serviceTemplate({ name: "orders", pascal: "Orders", description: "Orders.", area: "App" });
 */
export function serviceTemplate(options: TemplateOptions): readonly TemplateFile[] {
  const { name, description } = options;
  const area = options.area ?? "";
  const tasks = ["dev", "build", "typecheck", "lint", "test"];
  const packageJson = {
    name: `@figentra/service-${name}`,
    version: "0.0.0",
    private: true,
    description,
    license: "UNLICENSED",
    type: "module",
    sideEffects: false,
    imports: {
      "#config/*": aliasOf("src/config"),
      "#contracts/*": aliasOf("src/contracts"),
      "#modules/*": aliasOf("src/modules"),
      "#stackra/*": aliasOf(".stackra/gen"),
    },
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
        '{ "$schema": "https://turborepo.dev/schema.json", "extends": ["//"], "tags": ["tier:service"] }',
        "",
      ].join("\n"),
    },
    {
      path: "stackra.config.ts",
      content: [
        "/**",
        " * Stackra file contract:",
        ` * Purpose: the member definition of @figentra/service-${name}: static data that gen reads from the syntax tree`,
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
        `# Purpose: what @figentra/service-${name} needs at runtime beyond what gen derives (runway v3, ADR 0296).`,
        "# Boundary: names and sizes only; secret values come from Infisical through runway (ADR 0173).",
        "# Governing contract: ADR 0296 (decision 1).",
        "version: 3",
        "requires: {}",
        "secrets: []",
        "environments: {}",
        "",
      ].join("\n"),
    },
    {
      path: "README.md",
      content: [
        `# @figentra/service-${name}`,
        "",
        description,
        "",
        "A plain-TypeScript service member (`tier:service`) in the programming model v3 shape (ADR 0294, 0295). Feature",
        "modules go in `src/modules/<key>/`; `stackra gen` writes the wiring, the server entry and the Encore app into",
        "`.stackra/`. Nobody writes `main.ts`.",
        "",
      ].join("\n"),
    },
    {
      path: "AGENTS.md",
      content: [
        `# AGENTS — @figentra/service-${name}`,
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
      content: `# @figentra/service-${name}\n\nWritten by Changesets on release; never edited by hand.\n`,
    },
  ];
}
