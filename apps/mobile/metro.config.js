const fs = require("node:fs");
const path = require("node:path");

const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const config = getDefaultConfig(__dirname);

// The workspace packages (`@stackra/ui`, `@stackra/ui-pro`) are read as source: ADR 0025's export condition.
config.resolver.unstable_conditionNames = [
  ...(config.resolver.unstable_conditionNames ?? ["require", "import"]),
  "@stackra/source",
];

// One copy of each of these, resolved from the app wherever the importer lives: the packages under
// packages/design-system have their own node_modules, with the web catalog's React 19.3, and a second React,
// Reanimated or HeroUI instance breaks hooks, shared values and context.
const SINGLETONS = [
  "react",
  "react-native",
  "heroui-native",
  "heroui-native-pro",
  "uniwind",
  "react-native-reanimated",
  "react-native-worklets",
  "react-native-gesture-handler",
  "react-native-safe-area-context",
  "react-native-screens",
  "react-native-svg",
  "@gorhom/bottom-sheet",
  "@internationalized/date",
  "@internationalized/number",
];
const APP_ORIGIN = path.join(__dirname, "package.json");

const isSingleton = (name) =>
  SINGLETONS.some((singleton) => name === singleton || name.startsWith(`${singleton}/`));

// Metro reads only the first target of an `imports` array and wants the exact file, but the workspace packages list
// `./src/*`, `./src/*.ts`, `./src/*.tsx` and `./src/*/index.ts` as fallbacks; this takes the first that exists.
function resolveSubpathImport(context, specifier) {
  const pkg = context.getPackageForModule(context.originModulePath);
  const imports = pkg?.packageJson.imports;
  if (!imports) return null;
  for (const [key, targets] of Object.entries(imports)) {
    const star = key.indexOf("*");
    if (star === -1 || !Array.isArray(targets)) continue;
    const prefix = key.slice(0, star);
    const suffix = key.slice(star + 1);
    if (!specifier.startsWith(prefix) || !specifier.endsWith(suffix)) continue;
    const match = specifier.slice(prefix.length, specifier.length - suffix.length);
    for (const target of targets) {
      const filePath = path.join(pkg.rootPath, target.replaceAll("*", match));
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return { type: "sourceFile", filePath: fs.realpathSync(filePath) };
      }
    }
  }
  return null;
}

const baseResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const next = baseResolveRequest ?? context.resolveRequest;
  if (isSingleton(moduleName)) {
    return next({ ...context, originModulePath: APP_ORIGIN }, moduleName, platform);
  }
  if (moduleName.startsWith("#")) {
    const resolved = resolveSubpathImport(context, moduleName);
    if (resolved) return resolved;
  }
  return next(context, moduleName, platform);
};

module.exports = withUniwindConfig(config, {
  cssEntryFile: "./src/global.css",
  dtsFile: "./uniwind-types.d.ts",
});
