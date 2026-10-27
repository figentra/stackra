/**
 * Stackra file contract:
 * Purpose: Babel config of @figentra/mobile for Metro.
 * Boundary: build configuration only.
 * Runtime: node
 * Governing contract: ADR 0300 (published tooling presets).
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Reanimated 4 worklets (used by heroui-native); must be listed explicitly.
    plugins: ["react-native-worklets/plugin"],
  };
};
