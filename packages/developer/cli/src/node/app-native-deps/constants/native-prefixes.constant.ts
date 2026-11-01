/**
 * Stackra file contract:
 * Purpose: `NATIVE_PREFIXES`, the name prefixes of the libraries Expo autolinks: native code that must sit in an Expo
 *          app's own dependencies (moved from `tools/scripts/app-native-deps.mjs`).
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0117; STA-1544.
 */

/** Name prefixes of the libraries Expo autolinks. */
export const NATIVE_PREFIXES: readonly string[] = Object.freeze([
  "expo-",
  "react-native-",
  "@react-native",
  "@expo/ui",
  "@shopify/react-native",
]);
