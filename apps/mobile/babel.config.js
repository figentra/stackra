/**
 * Stackra file contract:
 * Purpose: Babel config of @figentra/mobile for Metro.
 * Boundary: build configuration only.
 * Runtime: node
 * Governing contract: ADR 0300 (published tooling presets).
 */
const path = require("node:path");

// The React Native preset runs flow-strip-types on every file, TypeScript included, and that plugin refuses a
// TypeScript `declare` field (`declare readonly props` in @stackra/ui's native `Component`) unless it is allowed.
// The same plugin, run first on TypeScript files only with `allowDeclareFields`, drops those fields before it sees
// them. Resolved through babel-preset-expo, which depends on it, so the app declares no copy of its own.
const flowStripTypes = require.resolve("@babel/plugin-transform-flow-strip-types", {
  paths: [path.dirname(require.resolve("babel-preset-expo/package.json"))],
});

// The override test is a function, not a RegExp: Expo's Metro transformer loads this config without a filename to
// build its cache key, and Babel throws on a string/RegExp pattern then (the React Native preset tests the same way).
const isTypeScriptSource = (filename) => typeof filename === "string" && /\.tsx?$/.test(filename);

/** The name of an object key or import attribute key (`type`, `"type"`). */
const keyName = (key) => key?.name ?? key?.value;

/** `{ type: "json" }`, the only attribute a JSON import carries. */
const isJsonTypeObject = (node) =>
  node?.type === "ObjectExpression" &&
  node.properties.length === 1 &&
  node.properties[0].type === "ObjectProperty" &&
  keyName(node.properties[0].key) === "type" &&
  node.properties[0].value.type === "StringLiteral" &&
  node.properties[0].value.value === "json";

/** `{ with: { type: "json" } }`, the options argument of a dynamic JSON import. */
const isJsonImportOptions = (node) =>
  node?.type === "ObjectExpression" &&
  node.properties.length === 1 &&
  node.properties[0].type === "ObjectProperty" &&
  keyName(node.properties[0].key) === "with" &&
  isJsonTypeObject(node.properties[0].value);

// Metro accepts only a one-argument `import()` (its dependency collector throws "Invalid call" on a second argument),
// while the workspace packages it reads as source keep the JSON import attribute Node needs to load a `.json` module
// (`import("./ae.json", { with: { type: "json" } })`, @stackra/market-packs). Metro loads a `.json` module as JSON by
// its extension, so the attribute carries nothing here: this drops it, and only it, so any other attribute still
// fails the build (STA-2893). Static `import … with { type: "json" }` needs nothing: Metro accepts it as it is.
// Both dynamic-import shapes are handled: a call on `Import` (Babel 7) and an `ImportExpression` (Babel 8).
const stripJsonImportAttributes = () => ({
  name: "stackra-strip-json-import-attributes",
  visitor: {
    CallExpression(callPath) {
      const { callee, arguments: args } = callPath.node;
      if (callee.type === "Import" && args.length === 2 && isJsonImportOptions(args[1])) args.pop();
    },
    ImportExpression(importPath) {
      if (isJsonImportOptions(importPath.node.options)) importPath.node.options = null;
    },
  },
});

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [stripJsonImportAttributes],
    // No `react-native-worklets/plugin` here: babel-preset-expo adds it whenever the package is installed, and a
    // second copy re-runs the worklet transform on its own output and crashes on Reanimated's sources.
    overrides: [
      { test: isTypeScriptSource, plugins: [[flowStripTypes, { allowDeclareFields: true }]] },
    ],
  };
};
