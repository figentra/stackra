/**
 * Stackra file contract:
 * Purpose: the Metro leg of the release gate's packed-tarball smoke (ADR 0177 PK4). Copied into the throwaway
 *   consumer by `release-gate.mjs smoke`; builds the iOS module graph (resolve and transform, as `expo export` does
 *   before it serialises) of one entry file per spec in the specs file with the consumer's Metro, under
 *   babel-preset-expo with package exports on, `.mjs` and `.cjs` sources and optional dependencies allowed, as an
 *   Expo app's Metro config has them. One IncrementalBundler serves every entry, so a module is transformed once.
 *   React Native, Expo and Electron host modules resolve to an empty module: the smoke checks Stackra's packages, not
 *   the hosts. Prints one JSON line per entry: `{ "spec": "...", "ok": true }` or `{ ..., "ok": false, "error": "..." }`.
 * Boundary: writes the entry files under `metro-entries/` in the consumer; no bundle and no cache on disk.
 * Runtime: node
 * Governing contract: ADR 0177 (decision 4); STA-2705.
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const IncrementalBundler = require("metro/private/IncrementalBundler").default;
const Server = require("metro/private/Server").default;
const { getDefaultConfig, mergeConfig } = require("metro-config");

/** Kept in step with HOST_MODULE in tools/scripts/release-gate.mjs (the test compares the two). */
const HOST_MODULE =
  /^(?:react-native(?:$|[-/])|@react-native(?:-community)?\/|expo(?:$|[-/])|@expo\/|electron$|heroui-native(?:$|\/)|uniwind(?:$|\/)|lucide-react-native(?:$|\/)|@shopify\/react-native-skia(?:$|\/)|victory-native(?:$|\/)|@10play\/|@react-navigation\/|@testing-library\/react-native(?:$|\/))/;

/** The first line of a Metro error, without the consumer's long store paths. */
function firstError(error) {
  return String((error && error.message) || error)
    .split("\n")[0]
    .replaceAll(/\/[^\s'"]*\/node_modules\/\.pnpm\/[^/]+\/node_modules\//g, "")
    .slice(0, 600);
}

async function main() {
  const root = process.cwd();
  const specs = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  // Every entry file exists before Metro crawls the project: a file written later has no SHA-1 in its file map.
  fs.mkdirSync(path.join(root, "metro-entries"), { recursive: true });
  const files = specs.map((spec, index) => {
    const file = path.join(root, "metro-entries", `entry-${index}.js`);
    fs.writeFileSync(
      file,
      `import * as m from ${JSON.stringify(spec)};\nglobalThis.__stackraSmoke = m;\n`,
    );
    return file;
  });
  const config = mergeConfig(await getDefaultConfig(root), {
    projectRoot: root,
    watchFolders: [root],
    cacheStores: [],
    resetCache: true,
    reporter: { update() {} },
    transformer: { allowOptionalDependencies: true },
    resolver: {
      sourceExts: ["js", "jsx", "mjs", "cjs", "json", "ts", "tsx"],
      unstable_enablePackageExports: true,
      resolveRequest: (context, name, platform) =>
        HOST_MODULE.test(name)
          ? { type: "empty" }
          : context.resolveRequest(context, name, platform),
    },
  });
  const bundler = new IncrementalBundler(config);
  const { customResolverOptions, ...graphOptions } = Server.DEFAULT_GRAPH_OPTIONS;
  try {
    for (const [index, spec] of specs.entries()) {
      try {
        await bundler.buildGraphForEntries(
          [files[index]],
          {
            ...graphOptions,
            customTransformOptions: Object.create(null),
            dev: false,
            minify: false,
            platform: "ios",
            type: "module",
          },
          { customResolverOptions: customResolverOptions ?? Object.create(null) },
        );
        console.log(JSON.stringify({ spec, ok: true }));
      } catch (error) {
        console.log(JSON.stringify({ spec, ok: false, error: firstError(error) }));
      }
    }
  } finally {
    await bundler.end();
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
  },
);
