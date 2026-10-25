/**
 * Stackra file contract:
 * Purpose: `emitToolConfigs`, the tool configs gen writes into `.stackra/` for a package or a service: tsdown with one
 *          entry per generated entry file, Vitest on the decorators preset with the shared coverage gate and the unit
 *          tier, and the Vitest setup that loads the registrations, registers the member's wiring for
 *          `createTestingModule` and pairs each `Factory<M>` with its model.
 * Boundary: pure. Paths are relative to the member root, which is where the tools run; Vitest's root is set to it
 *           explicitly. Apps and workers get none here: their Vite, Expo, Metro and Wrangler files come with their
 *           `defineApp` sections. Factory pairs live only in the test setup, so a server never loads a factory.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 5: gen writes every tool file into `.stackra/`); ADR 0182 (test tiers and
 *                     coverage); ADR 0025 (build output); ADR 0263 (decision 12: testing modules).
 */
import { generatedHeader } from "#core/functions/generated-header.function";
import { importLines } from "#core/functions/import-lines.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The tool configs of `ir`.
 *
 * @param ir - the member read by discovery.
 * @param generated - the entry files and whether `#stackra/registrations` was written.
 * @example
 * emitToolConfigs(ir, { entries, registrations: true }).map((file) => file.path);
 * // [".stackra/tsdown.config.ts", ".stackra/vitest.config.ts", ".stackra/vitest.setup.ts"]
 */
export function emitToolConfigs(
  ir: MemberIR,
  generated: { readonly entries: readonly GeneratedFile[]; readonly registrations: boolean },
): GeneratedFile[] {
  if (ir.layout !== "package" && ir.layout !== "service") return [];
  const entries = generated.entries
    .map((file) => /^\.stackra\/entry\/([a-z]+)\.ts$/.exec(file.path)?.[1])
    .filter((name): name is string => name !== undefined);
  const tsdown = [
    generatedHeader({
      from: "the generated entry files",
      purpose: `the build of ${ir.package}: one tsdown entry per entry file gen writes.`,
      boundary: "run from the member root: `tsdown --config .stackra/tsdown.config.ts`.",
      runtime: "node",
    }),
    'import { library } from "@stackra/tsdown-config";',
    "",
    "export default library({",
    ...entries.map((name) => `  ${JSON.stringify(name)}: ".stackra/entry/${name}.ts",`),
    "});",
    "",
  ].join("\n");

  const vitest = [
    generatedHeader({
      from: "stackra.config.ts",
      purpose:
        `the unit tests of ${ir.package}: the decorators preset and the shared coverage gate, the unit tier only, ` +
        "with the generated setup.",
      boundary:
        "`<subject>.test.ts(x)` in `__tests__/`; the infixed tiers (`.int`, `.contract`, `.e2e`, `.load`) run under " +
        "their own tasks. Run from anywhere: the root is the member.",
      runtime: "node",
    }),
    'import { fileURLToPath } from "node:url";',
    "",
    'import { withCoverage } from "@stackra/vitest-config/coverage";',
    'import { stackraVitestDecorators } from "@stackra/vitest-config/preset-decorators";',
    'import { defineConfig, mergeConfig } from "vitest/config";',
    "",
    "export default mergeConfig(",
    "  stackraVitestDecorators,",
    "  defineConfig(",
    "    withCoverage({",
    '      root: fileURLToPath(new URL("..", import.meta.url)),',
    "      test: {",
    '        include: ["src/**/__tests__/**/*.test.{ts,tsx}"],',
    '        exclude: ["**/*.{int,contract,e2e,load}.test.{ts,tsx}"],',
    '        setupFiles: [".stackra/vitest.setup.ts"],',
    "      },",
    "    }),",
    "  ),",
    ");",
    "",
  ].join("\n");

  const imports = new Map<string, Map<string, boolean>>([
    ["@stackra/container/testing", new Map([["registerWiring", false]])],
    ["#stackra/wiring", new Map([["wiring", false]])],
  ]);
  const pairs: string[] = [];
  for (const declared of ir.classes) {
    const model = declared.partner;
    if (declared.kind !== "factory" || model === undefined) continue;
    for (const target of [{ name: declared.name, from: declared.importPath }, model])
      imports.set(
        target.from,
        (imports.get(target.from) ?? new Map<string, boolean>()).set(target.name, false),
      );
    pairs.push(`  [${declared.name}, ${model.name}],`);
  }
  if (pairs.length > 0)
    imports.set("@stackra/database", new Map([["registerModelPartners", false]]));
  const setup = [
    generatedHeader({
      from: "#stackra/wiring, #stackra/registrations and the factories under src/",
      purpose: `the test setup of ${ir.package}: registrations, the wiring for createTestingModule, factory partners.`,
      boundary: "loaded by Vitest before every test file; a server never loads it.",
      runtime: "node",
    }),
    ...(generated.registrations ? ['import "#stackra/registrations";'] : []),
    ...importLines(imports),
    "",
    "registerWiring(wiring);",
    ...(pairs.length > 0 ? ["registerModelPartners([", ...pairs, "]);"] : []),
    "",
  ].join("\n");

  return [
    ...(entries.length > 0 ? [{ path: ".stackra/tsdown.config.ts", content: tsdown }] : []),
    { path: ".stackra/vitest.config.ts", content: vitest },
    { path: ".stackra/vitest.setup.ts", content: setup },
  ];
}
