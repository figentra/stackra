/**
 * Stackra file contract:
 * Purpose: `emitToolConfigs`, the tool configs gen writes into `.stackra/` for a package or a service: tsdown with one
 *          entry per generated entry file, Vitest on the decorators preset with the shared coverage gate and the unit
 *          tier, and the Vitest setup that loads the registrations and (for a member on `@stackra/database`,
 *          `@stackra/clients`, `@stackra/actions`, `@stackra/workflow`, `@stackra/tenancy` or `@stackra/scope`) that
 *          package's testing entry,
 *          registers the member's wiring for
 *          `createTestingModule`, imports each generated schemas file statically (through Vite, so its `#` imports and
 *          decorators resolve as in source; STA-2032) so a test file's top-level `X.create(...)` finds its schema, and pairs each `Factory<M>`
 *          with its model; the root
 *          `vitest.config.ts` shim that re-exports the generated config, since `vitest run` reads only the member root
 *          (STA-1296); and, for a service, `TYPECHECK_TSCONFIG`, its tsconfig without the `paths` that exist for
 *          Encore (STA-2681).
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
import { factoryPairsOf } from "#core/functions/factory-pairs-of.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import { GENERATED_NOTICE } from "#core/constants/generated-notice.constant";
import { ROOT_DTS_TSCONFIG } from "#core/constants/root-dts-tsconfig.constant";
import { ROOT_TSDOWN_SHIM } from "#core/constants/root-tsdown-shim.constant";
import { ROOT_VITEST_SHIM } from "#core/constants/root-vitest-shim.constant";
import { TYPECHECK_TSCONFIG } from "#core/constants/typecheck-tsconfig.constant";
import { importLines } from "#core/functions/import-lines.function";
import { schemaModules } from "#core/functions/schema-modules.function";
import { tokenExpression } from "#core/functions/token-expression.function";
import type { ClassRef } from "#core/types/class-ref.type";
import type { GeneratedFile } from "#core/types/generated-file.type";
import { usesContainer } from "#core/functions/uses-container.function";
import type { MemberIR } from "#core/types/member-ir.type";

/** A short string array on one line, as oxfmt writes it in JSON (`["a", "b"]`). */
const inline = (items: readonly string[]): string =>
  `[${items.map((item) => JSON.stringify(item)).join(", ")}]`;

/** The service preset's `include` (`@stackra/typescript-config/service`), from `.stackra/`. */
const SERVICE_TYPECHECK_INCLUDE = [
  "../src",
  "../stackra.config.ts",
  "../.stackra/gen",
  "../.stackra/entry",
  "../.stackra/*.config.ts",
];

/**
 * The tool configs of `ir`.
 *
 * @param ir - the member read by discovery.
 * @param generated - the entry files and whether `#stackra/registrations` was written.
 * @example
 * emitToolConfigs(ir, { entries, registrations: true }).map((file) => file.path);
 * // [".stackra/tsdown.config.ts", ".stackra/vitest.config.ts", ".stackra/vitest.setup.ts", "vitest.config.ts"]
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
      boundary: "run from the member root as plain `tsdown`, which loads it through the root shim.",
      runtime: "node",
    }),
    ...(ir.layout === "package"
      ? [
          'import { fileURLToPath } from "node:url";',
          "",
          'import { library } from "@stackra/tsdown-config";',
          "",
          "// Absolute entries: tsdown globs them, and a glob skips the dot-folder `.stackra/`. The declarations come from",
          "// the root tsconfig.build.json, since tsgo roots them at the tsconfig's folder. Typed for declaration emit.",
          "const config: ReturnType<typeof library> = {",
          "  ...library({",
          ...entries.map(
            (name) =>
              `    ${JSON.stringify(name)}: fileURLToPath(new URL("entry/${name}.ts", import.meta.url)),`,
          ),
          "  }),",
          '  dts: { tsconfig: fileURLToPath(new URL("../tsconfig.build.json", import.meta.url)) },',
          "};",
          "",
          "export default config;",
        ]
      : [
          // A service builds nothing with tsdown (Encore builds it at deploy).
          'import { library } from "@stackra/tsdown-config";',
          "",
          // Typed for declaration emit: inferred, the type is tsdown's, which a service cannot name (TS2883, STA-1743).
          "const config: ReturnType<typeof library> = library({",
          ...entries.map((name) => `  ${JSON.stringify(name)}: ".stackra/entry/${name}.ts",`),
          "});",
          "",
          "export default config;",
        ]),
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
    'import { mergeConfig } from "vitest/config";',
    "",
    "export default mergeConfig(",
    "  stackraVitestDecorators,",
    // No defineConfig: its `UserConfig` would become withCoverage's `T`, compared with the preset's `UserConfig`; two
    // copies of vitest's types (a linked preset) blow the stack (TS2321). Inferred from the literal, `T` stays shallow.
    "  withCoverage({",
    '    root: fileURLToPath(new URL("..", import.meta.url)),',
    "    test: {",
    // A package's generated migration check sits in `.stackra/tests` (STA-1689); `.int.test.ts` stays excluded below.
    ir.layout === "package"
      ? '      include: ["src/**/__tests__/**/*.test.{ts,tsx}", ".stackra/tests/**/*.test.{ts,tsx}"],'
      : '      include: ["src/**/__tests__/**/*.test.{ts,tsx}"],',
    // A member fresh from `stackra new` has no source and so no tests; one with source and no tests still fails.
    ...(ir.files.length === 0 ? ["      passWithNoTests: true,"] : []),
    '      exclude: ["**/*.{int,contract,e2e,load}.test.{ts,tsx}"],',
    '      setupFiles: [".stackra/vitest.setup.ts"],',
    "    },",
    "  }),",
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
              ["markMemberSchemasLoaded", false],
              ["registerWiring", false],
            ]),
          ],
          ["#stackra/wiring", new Map([["wiring", false]])],
        ]
      : [],
  );
  const pairs: string[] = [];
  for (const declared of factoryPairsOf(ir)) {
    const model = declared.partner;
    for (const target of [{ name: declared.name, from: declared.importPath }, model])
      imports.set(
        target.from,
        (imports.get(target.from) ?? new Map<string, boolean>()).set(target.name, false),
      );
    pairs.push(`  [${declared.name}, ${model.name}],`);
  }
  if (pairs.length > 0)
    imports.set("@stackra/database", new Map([["registerModelPartners", false]]));
  // A seeder is not a binding: the setup registers the tokens its constructor takes, so `.seed()` injects them
  // (STA-1698). Only a member on the database seeds.
  const use = (target: ClassRef): string => {
    imports.set(
      target.from,
      (imports.get(target.from) ?? new Map<string, boolean>()).set(target.name, false),
    );
    return target.name;
  };
  const seederDeps: string[] = [];
  if (ir.packages?.includes("@stackra/database") === true)
    for (const declared of ir.classes) {
      if (declared.kind !== "seeder" || declared.deps.length === 0) continue;
      use({ name: declared.name, from: declared.importPath });
      seederDeps.push(
        `  [${declared.name}, [${declared.deps.map((dep) => tokenExpression(dep, use)).join(", ")}]],`,
      );
    }
  if (seederDeps.length > 0) use({ name: "registerSeederDeps", from: "@stackra/database/testing" });
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
    // The memory `AccessControl` and the actions testing plugin, so a `useDrivers("memory")` test that only queues
    // work or runs an action finds its permission check.
    ...(ir.packages?.includes("@stackra/actions") === true
      ? ['import "@stackra/actions/testing";']
      : []),
    // The workflow testing plugin, so a `useDrivers("memory")` test that starts a workflow (`ctx.run`) finds its runner.
    ...(ir.packages?.includes("@stackra/workflow") === true
      ? ['import "@stackra/workflow/testing";']
      : []),
    // The memory `CallIsolation`, so a `useDrivers("memory")` call runs as its actor's tenant, as in production.
    ...(ir.packages?.includes("@stackra/tenancy") === true
      ? ['import "@stackra/tenancy/testing";']
      : []),
    // The scope testing plugin, so a `useDrivers("memory")` scope tree reads the stored scope nodes.
    ...(ir.packages?.includes("@stackra/scope") === true
      ? ['import "@stackra/scope/testing";']
      : []),
    ...(generated.registrations ? ['import "#stackra/registrations";'] : []),
    // Each schemas file registers its shapes. Imported here, the setup Vite transforms loads them through Vite too; a
    // package's `loadMemberSchemas` would import them from node_modules, which Vitest leaves to Node: no fallback in
    // the `#modules/*` targets and no legacy decorators (STA-2032). A relative path from `.stackra/`, so no imports map.
    ...(container ? schemaModules(ir).map((module) => `import "./gen/schemas/${module}.ts";`) : []),
    ...importLines(imports),
    "",
    // So the testing module's `compile()` does not import them again through Node.
    ...(container ? ["registerWiring(wiring);", "markMemberSchemasLoaded();"] : []),
    ...(pairs.length > 0 ? ["registerModelPartners([", ...pairs, "]);"] : []),
    ...(seederDeps.length > 0 ? ["registerSeederDeps([", ...seederDeps, "]);"] : []),
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

  // tsdown takes a `--config` file's folder as its cwd, where `.stackra/entry/*` does not resolve; run from the
  // member root, it finds this shim and keeps the root as cwd, as a package with an authored root config does.
  const shimTarget = "./.stackra/tsdown.config.ts";
  const tsdownShim = [
    generatedHeader({
      from: ".stackra/tsdown.config.ts",
      purpose: `the root shim of ${ir.package}'s tsdown config: \`tsdown\` runs from the member root.`,
      boundary:
        "a re-export only, gitignored; written only when no root config exists. An authored one that imports " +
        "./.stackra/tsdown.config is kept; any other is refused.",
      runtime: "node",
    }),
    // The extension: tsdown's native config loader resolves no extensionless import. Generated text, not an import
    // of this file, so ADR 0233's no-extension rule (which reads `from "…"` literals) does not apply.
    `export { default } from "${shimTarget}";`,
    "",
  ].join("\n");

  // The member's program plus the entries gen writes; tests and the hand-written entries directly in `src/` (which no
  // barrel re-exports) ship no declarations.
  // Written in oxfmt's layout, so a member's format check passes on the file as gen writes it.
  const dtsTsconfig = [
    "{",
    `  "$comment": ${JSON.stringify(`${GENERATED_NOTICE}; from the generated entry files. Purpose: the declaration build of ${ir.package}: the member's tsconfig plus .stackra/entry.`)},`,
    `  "extends": "./tsconfig.json",`,
    `  "include": ${inline(["src", ".stackra/entry"])},`,
    `  "exclude": ${inline(["src/**/__tests__/**", "src/*.ts", "src/*.tsx"])}`,
    "}",
    "",
  ].join("\n");

  // A service's tsconfig carries `paths` for Encore; tsc would apply them to every package the service compiles, so its
  // typecheck reads the same tsconfig with none, and each package's `#` imports resolve through its own package.json.
  // The service preset's `include` names its files from `${configDir}`, which is this config's folder here, so this one
  // names the same files from the member root. A wildcard would not do: tsc's `**` skips dot folders, and losing
  // `.stackra/gen` drops the entity augmentations gen writes there.
  const typecheckTsconfig = [
    "{",
    `  "$comment": ${JSON.stringify(`${GENERATED_NOTICE}; from the member's tsconfig. Purpose: the typecheck program of a service: its tsconfig without the paths that exist for Encore.`)},`,
    `  "extends": "../tsconfig.json",`,
    `  "include": ${inline(SERVICE_TYPECHECK_INCLUDE)},`,
    `  "compilerOptions": {`,
    `    "paths": {}`,
    `  }`,
    "}",
    "",
  ].join("\n");

  return [
    ...(entries.length > 0 ? [{ path: ".stackra/tsdown.config.ts", content: tsdown }] : []),
    { path: ".stackra/vitest.config.ts", content: vitest },
    { path: ".stackra/vitest.setup.ts", content: setup },
    ...(ir.layout === "service" ? [{ path: TYPECHECK_TSCONFIG, content: typecheckTsconfig }] : []),
    { path: ROOT_VITEST_SHIM, content: shim },
    // A service builds nothing with tsdown (Encore builds it at deploy), so only a package gets the shim.
    ...(entries.length > 0 && ir.layout === "package"
      ? [
          { path: ROOT_TSDOWN_SHIM, content: tsdownShim },
          { path: ROOT_DTS_TSCONFIG, content: dtsTsconfig },
        ]
      : []),
  ];
}
