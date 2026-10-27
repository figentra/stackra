/**
 * Stackra file contract:
 * Purpose: Babel config of @figentra/{{NAME}} for Metro.
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

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // No `react-native-worklets/plugin` here: babel-preset-expo adds it whenever the package is installed, and a
    // second copy re-runs the worklet transform on its own output and crashes on Reanimated's sources.
    overrides: [
      { test: isTypeScriptSource, plugins: [[flowStripTypes, { allowDeclareFields: true }]] },
    ],
  };
};
