/**
 * Stackra file contract:
 * Purpose: `EXPO_OWNED_PLUGINS`, the Expo config plugins gen writes for an app, which the `expo` section of
 *          `defineApp` may not list (`expo_owned_key`).
 * Boundary: data only; `emitExpoConfig` writes each of these from other facts and refuses a section that sets one.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 3: a section is the tool's shape minus the keys Stackra owns; decision 4.5).
 */

/** The owned config plugins, in the order gen writes them after the section's own plugins. */
export const EXPO_OWNED_PLUGINS = [
  "expo-localization",
  "expo-location",
  "expo-media-library",
  "expo-local-authentication",
  "expo-widgets",
  "expo-alternate-app-icons",
  "@stackra/native-share",
  "@stackra/native-spotlight",
] as const;
