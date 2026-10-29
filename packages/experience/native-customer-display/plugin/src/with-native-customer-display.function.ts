/**
 * Stackra file contract:
 * Purpose: `withNativeCustomerDisplay`, the config plugin of @stackra/native-customer-display (ADR 0478 decision 2).
 * Boundary: build time only, in Expo CLI at prebuild. It changes nothing today: an Android `Presentation` needs no
 *           manifest entry, and the iPad's external-display scene comes from the app's scene support
 *           (`enableSceneSupport` of expo-build-properties); whether it stays is the spike STA-475. It exists so a
 *           later native key lands in this package and never in the app.
 * Runtime: node
 * Governing contract: ADR 0478 (decisions 2 and 3); ADR 0344 (open spike 1).
 */
import type { ConfigPlugin } from "expo/config-plugins.js";

/**
 * The config plugin; returns the app config unchanged.
 *
 * @example
 * // app.json
 * "plugins": ["@stackra/native-customer-display"]
 */
export const withNativeCustomerDisplay: ConfigPlugin = (config) => config;
