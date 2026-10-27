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

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Reanimated 4 worklets (used by heroui-native); must be listed explicitly.
    plugins: ["react-native-worklets/plugin"],
    overrides: [{ test: /\.tsx?$/, plugins: [[flowStripTypes, { allowDeclareFields: true }]] }],
  };
};
