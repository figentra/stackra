module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Reanimated 4 worklets (used by heroui-native); must be listed explicitly.
    plugins: ["react-native-worklets/plugin"],
  };
};
