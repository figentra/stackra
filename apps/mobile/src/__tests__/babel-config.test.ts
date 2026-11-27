/**
 * Stackra file contract:
 * Purpose: guards the mobile bundle against JSON import attributes (STA-2893): through the app's own Babel config,
 *          @stackra/market-packs' bundled-pack loaders (`import("…json", { with: { type: "json" } })`) pass Metro's
 *          dependency collector as one async dependency per pack file, and a static `import … with { type: "json" }`
 *          passes too; without the config's plugin the same loaders still fail as `expo export` did, so the plugin is
 *          proven needed, and any other attribute is still refused.
 * Boundary: build configuration only; Babel and Metro's collector run in Node, resolved the way Expo's Metro
 *           transformer resolves them; no React Native module loads.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); ADR 0300 (published tooling presets).
 */
import { describe, expect, it } from "vitest";

/** A CommonJS `require`, as `createRequire` returns it. */
type Require = ((id: string) => unknown) & {
  resolve: (id: string, options?: { paths?: string[] }) => string;
};

// The Node built-ins this test needs, typed here: the Expo preset carries no Node types, since app code never runs
// on Node; vitest does, and Node hands them out through `process.getBuiltinModule`.
const node = (globalThis as unknown as { process: { getBuiltinModule: (id: string) => unknown } })
  .process;
const { readdirSync, readFileSync } = node.getBuiltinModule("node:fs") as {
  readdirSync: (folder: string) => string[];
  readFileSync: (file: string, encoding: "utf8") => string;
};
const { createRequire } = node.getBuiltinModule("node:module") as {
  createRequire: (from: string) => Require;
};
const path = node.getBuiltinModule("node:path") as {
  basename: (file: string) => string;
  dirname: (file: string) => string;
  join: (...parts: string[]) => string;
};
const { fileURLToPath } = node.getBuiltinModule("node:url") as {
  fileURLToPath: (url: URL) => string;
};

/** The app folder, where babel.config.js sits. */
const APP_ROOT = fileURLToPath(new URL("../../", import.meta.url));

/** The bundled-pack loaders of @stackra/market-packs, as Metro reads them (the `@stackra/source` condition). */
const LOADERS = fileURLToPath(
  new URL(
    "../../../../packages/foundation/market-packs/src/core/constants/bundled-pack-loaders.constant.ts",
    import.meta.url,
  ),
);

/** The pack files those loaders import. */
const PACKS = fileURLToPath(
  new URL("../../../../packages/foundation/market-packs/assets/data/packs/", import.meta.url),
);

// Babel and Metro as Expo's Metro transformer loads them: @expo/metro-config re-exports its own @babel/core, and
// Metro's collector is the step that threw "Invalid call" in `expo export`.
const requireFromApp = createRequire(path.join(APP_ROOT, "package.json"));
const expoDir = path.dirname(requireFromApp.resolve("expo/package.json"));
const requireFromMetroConfig = createRequire(
  requireFromApp.resolve("@expo/metro-config/package.json", { paths: [expoDir] }),
);
const babel = requireFromMetroConfig("@babel/core") as {
  transformSync: (code: string, options: Record<string, unknown>) => { ast?: unknown } | null;
};
const collectDependencies = (
  requireFromMetroConfig("metro/private/ModuleGraph/worker/collectDependencies") as {
    default: (
      ast: unknown,
      options: Record<string, unknown>,
    ) => { dependencies: readonly { name: string; data: { asyncType: string | null } }[] };
  }
).default;

/** Metro's collector options for an app bundle (the values metro-transform-worker passes). */
const COLLECT_OPTIONS = {
  asyncRequireModulePath: "expo/internal/async-require-module",
  dependencyMapName: null,
  dynamicRequires: "reject",
  inlineableCalls: [],
  keepRequireNames: true,
  allowOptionalDependencies: false,
  unstable_allowRequireContext: false,
  unstable_isESMImportAtSource: null,
};

/**
 * Transforms `code` as Metro would for iOS, with the app's babel.config.js or, with `appConfig: false`, with
 * babel-preset-expo alone, and runs Metro's collector over the result.
 */
function bundleDependencies(code: string, filename: string, appConfig = true) {
  const result = babel.transformSync(code, {
    filename,
    cwd: APP_ROOT,
    root: APP_ROOT,
    babelrc: false,
    configFile: appConfig ? path.join(APP_ROOT, "babel.config.js") : false,
    presets: appConfig ? [] : [requireFromApp.resolve("babel-preset-expo")],
    caller: { name: "metro", bundler: "metro", platform: "ios" },
    sourceType: "module",
    ast: true,
    code: false,
  });
  return collectDependencies(result?.ast, COLLECT_OPTIONS).dependencies;
}

describe("the mobile Babel config and JSON import attributes", () => {
  it("hands Metro every bundled-pack loader as one async dependency per pack file", () => {
    // The collector also lists the async-require helper every `import()` goes through.
    const dependencies = bundleDependencies(readFileSync(LOADERS, "utf8"), LOADERS).filter(
      (dependency) => dependency.name.endsWith(".json"),
    );
    const packs = readdirSync(PACKS).filter((file) => file.endsWith(".json"));

    expect(packs.length).toBeGreaterThan(0);
    expect(dependencies.map((dependency) => path.basename(dependency.name)).toSorted()).toEqual(
      packs.toSorted(),
    );
    expect(dependencies.every((dependency) => dependency.data.asyncType === "async")).toBe(true);
  });

  it("leaves a static JSON import with an attribute to Metro, which accepts it", () => {
    const dependencies = bundleDependencies(
      'import pack from "./ae.json" with { type: "json" };\nexport default pack;\n',
      path.join(APP_ROOT, "src", "static-json.ts"),
    );

    expect(dependencies.map((dependency) => dependency.name)).toContain("./ae.json");
  });

  it("still refuses an attribute other than a JSON type", () => {
    expect(() =>
      bundleDependencies(
        'export const load = () => import("./a.css", { with: { type: "css" } });\n',
        path.join(APP_ROOT, "src", "css-import.ts"),
      ),
    ).toThrow(/Invalid call/);
  });

  // If Metro ever accepts a second `import()` argument, this fails: the plugin in babel.config.js can then go.
  it("is needed: without the app's plugin Metro refuses the loaders as `expo export` did", () => {
    expect(() => bundleDependencies(readFileSync(LOADERS, "utf8"), LOADERS, false)).toThrow(
      /Invalid call/,
    );
  });
});
