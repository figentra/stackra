/**
 * Stackra file contract:
 * Purpose: `PropertiesItem`, one line of a properties file (`android/gradle.properties`) as Expo's config plugins read
 *          it: a property, a comment or an empty line.
 * Boundary: a type only; it mirrors Expo's `AndroidConfig.Properties.PropertiesItem` so the plugin's helpers test on
 *           plain objects.
 * Runtime: node
 * Governing contract: ADR 0478 (decision 2).
 */

/** One line of a properties file, as Expo's config plugins read it. */
export type PropertiesItem =
  | { readonly type: "property"; readonly key: string; readonly value: string }
  | { readonly type: "comment"; readonly value: string }
  | { readonly type: "empty" };
