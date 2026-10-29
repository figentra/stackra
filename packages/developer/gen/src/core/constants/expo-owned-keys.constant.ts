/**
 * Stackra file contract:
 * Purpose: `EXPO_OWNED_KEYS`, the Expo config keys gen writes for an app, which the `expo` section of `defineApp`
 *          may not set (`expo_owned_key`).
 * Boundary: data only; `emitExpoConfig` writes each of these from other facts and refuses a section that sets one.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 3: a section is the tool's shape minus the keys Stackra owns; decision 4.5).
 */

/** The owned Expo config keys, as dotted paths from the `expo` object. */
export const EXPO_OWNED_KEYS = [
  "name",
  "slug",
  "scheme",
  "version",
  "ios.bundleIdentifier",
  "ios.supportsTablet",
  "ios.associatedDomains",
  "ios.infoPlist.NSSupportsLiveActivities",
  "android.package",
] as const;
