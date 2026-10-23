const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const config = getDefaultConfig(__dirname);

// Metro takes only the first target of a package.json `imports` array and adds no extension, so it cannot follow the
// `#src/*` fallbacks tsc uses (ADR 0233). Map the alias to the source folder and let Metro probe the extensions.
config.resolver.resolveRequest = (context, moduleName, platform) =>
  context.resolveRequest(
    context,
    moduleName.startsWith("#src/") ? path.join(__dirname, "src", moduleName.slice(5)) : moduleName,
    platform,
  );

module.exports = withUniwindConfig(config, {
  cssEntryFile: "./src/styles/global.css",
  dtsFile: "./uniwind-types.d.ts",
});
