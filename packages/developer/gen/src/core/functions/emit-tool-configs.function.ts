/**
 * Stackra file contract:
 * Purpose: `emitToolConfigs`, the tool configs gen writes into `.stackra/` for a package or a service: tsdown with one
 *          entry per generated entry file, Vitest on the decorators preset with the shared coverage gate and the unit
 *          tier, and the Vitest setup that loads the registrations and (for a member on `@stackra/database` or
 *          `@stackra/clients`) that package's testing entry, registers the member's wiring for `createTestingModule`, awaits `loadMemberSchemas` (from
 *          the working directory, the member root vitest runs in) so a test file's top-level `X.create(...)` finds its schema, and pairs each `Factory<M>` with its model; and the root
 *          `vitest.config.ts` shim that re-exports the generated config, since `vitest run` reads only the member root
 *          (STA-1296).
 * Boundary: pure. Paths are relative to the member root, which is where the tools run; Vitest's root is set to it
 *           explicitly. Apps and workers get none here: their Vite, Expo, Metro and Wrangler files come with their
 *           `defineApp` sections. Factory pairs live only in the test setup, so a server never loads a factory.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 5: gen writes every tool file into `.stackra/`); ADR 0182 (test tiers and
 *                     coverage); ADR 0025 (build output); ADR 0263 (decision 12: testing modules); STA-1293 (the database
 *                     testing entry and the member's schemas in the setup); STA-1365 (a member off
 *                     `@stackra/container`, `usesContainer`, gets a setup without the wiring, the schemas and
 *                     `@stackra/container/testing`).
 */
import { GENERATED_NOTICE } from "#core/constants/generated-notice.constant";
import { generatedHeader } from "#core/functions/generated-header.function";
import { ROOT_VITEST_SHIM } from "#core/constants/root-vitest-shim.constant";
import { importLines } from "#core/functions/import-lines.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import { usesContainer } from "#core/functions/uses-container.function";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The tool configs of `ir`.
 *
 * @param ir - the member read by discovery.
 * @param generated - the entry files and whether `#stackra/registrations` was written.
 * @example
 * emitToolConfigs(ir, { entries, registrations: true }).map((file) => file.path);
 * // [".stackra/tsdown.config.ts", ".stackra/tsconfig.build.json", ".stackra/vitest.config.ts", ".stackra/vitest.setup.ts", "vitest.config.ts"]
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
    'import { fileURLToPath } from "node:url";',
    "",
    'import { library } from "@stackra/tsdown-config";',
    "",
    "// tsdown takes the config file's folder as cwd and does not resolve a relative entry under `.stackra/`.",
    "// Typed, so declaration emit can name the export (TS2883).",
    "const config: ReturnType<typeof library> = {",
    "  ...library({",
    ...entries.map(
      (name) =>
        `    ${JSON.stringify(name)}: fileURLToPath(new URL("entry/${name}.ts", import.meta.url)),`,
    ),
    "  }),",
    '  cwd: fileURLToPath(new URL("..", import.meta.url)),',
    "  dts: {",
    '    tsconfig: fileURLToPath(new URL("tsconfig.build.json", import.meta.url)),',
    "    // rolldown-plugin-dts otherwise roots declarations at the entries' folder, `.stackra/`.",
    '    compilerOptions: { rootDir: fileURLToPath(new URL("..", import.meta.url)) },',
    "  },",
    "};",
    "",
    "export default config;",
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
    // A member fresh from `stackra new` has no source and so no tests; one with source and no tests still fails.
    ...(ir.files.length === 0 ? ["        passWithNoTests: true,"] : []),
    '        exclude: ["**/*.{int,contract,e2e,load}.test.{ts,tsx}"],',
    '        setupFiles: [".stackra/vitest.setup.ts"],',
    "      },",
    "    }),",
    "  ),",
    ");",
    "",
  ].join("\n");

  // A member off the container (`@stackra/testing`, rule 6c) has no wiring: its setup loads only what it has (STA-1365).
  const container = usesContainer(ir);
  const imports = new Map<string, Map<string, boolean>>(
    container
      ? [
          [
            "@stackra/container/testing",
            new Map([
              ["loadMemberSchemas", false],
              ["registerWiring", false],
            ]),
          ],
          ["#stackra/wiring", new Map([["wiring", false]])],
        ]
      : [],
  );
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
      from: `${container ? "#stackra/wiring, " : ""}#stackra/registrations and the factories under src/`,
      purpose: `the test setup of ${ir.package}: registrations, ${container ? "the wiring for createTestingModule, " : ""}factory partners.`,
      boundary: "loaded by Vitest before every test file; a server never loads it.",
      runtime: "node",
    }),
    // The memory database driver and `app.repository(...)`, when the member runs on the database.
    ...(ir.packages?.includes("@stackra/database") === true
      ? ['import "@stackra/database/testing";']
      : []),
    // The memory `ClientTransport` (`ClientFake`) a test picks with `useDrivers("memory")` (STA-1297).
    ...(ir.packages?.includes("@stackra/clients") === true
      ? ['import "@stackra/clients/testing";']
      : []),
    ...(generated.registrations ? ['import "#stackra/registrations";'] : []),
    ...importLines(imports),
    "",
    ...(container
      ? [
          "registerWiring(wiring);",
          // The working directory: vitest runs in the member root, and its transform gives `import.meta.url` no
          // file: scheme here.
          "await loadMemberSchemas();",
        ]
      : []),
    ...(pairs.length > 0 ? ["registerModelPartners([", ...pairs, "]);"] : []),
    "",
  ].join("\n");

  // Members run `vitest run` from the root, which reads only `vitest.config.ts` there: the shim points it at the
  // generated config, so the setup above loads (ADR 0295 decision 5; STA-1296).
  const shim = [
    generatedHeader({
      from: ".stackra/vitest.config.ts",
      purpose: `the root shim of ${ir.package}'s Vitest config: \`vitest run\` reads only the member root.`,
      boundary:
        "a re-export only, gitignored; written only when no root config exists. An authored one that merges " +
        "./.stackra/vitest.config is kept; any other is refused.",
      runtime: "node",
    }),
    'export { default } from "./.stackra/vitest.config";',
    "",
  ].join("\n");

  // tsgo emits declarations for the files its tsconfig includes, and the member presets leave `.stackra/` out (its
  // generated sources are not typechecked yet), so the build has its own program: the member's plus the entries.
  const dtsTsconfig = `${JSON.stringify(
    {
      $comment: `${GENERATED_NOTICE}; from the generated entry files. Purpose: the declaration build of ${ir.package}: the member's tsconfig plus the entries gen writes.`,
      extends: "../tsconfig.json",
      // The presets' `${configDir}` is `.stackra/` here, so the root is named. Tests and the
      // hand-written entries directly in `src/` (no barrel re-exports them) ship no declarations.
      compilerOptions: { rootDir: ".." },
      include: ["../src", "entry"],
      exclude: ["../src/**/__tests__/**", "../src/*.ts", "../src/*.tsx"],
    },
    null,
    2,
  )}\n`;

  return [
    ...(entries.length > 0
      ? [
          { path: ".stackra/tsdown.config.ts", content: tsdown },
          { path: ".stackra/tsconfig.build.json", content: dtsTsconfig },
        ]
      : []),
    { path: ".stackra/vitest.config.ts", content: vitest },
    { path: ".stackra/vitest.setup.ts", content: setup },
    { path: ROOT_VITEST_SHIM, content: shim },
  ];
}
