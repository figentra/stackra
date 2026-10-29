/**
 * Stackra file contract:
 * Purpose: `withNativeSpotlight`, the config plugin of @stackra/native-spotlight (ADR 0478 decision 2).
 * Boundary: build time only, in Expo CLI at prebuild. It changes nothing today: Core Spotlight needs no Info.plist
 *           key and launcher shortcuts no manifest entry, and the module's app delegate subscriber is linked by
 *           autolinking. It exists so a later native key lands in this package and never in the app.
 * Runtime: node
 * Governing contract: ADR 0478 (decisions 2 and 3).
 */
import type { ConfigPlugin } from "expo/config-plugins";

/**
 * The config plugin; returns the app config unchanged.
 *
 * @example
 * // app.config.ts
 * plugins: ["@stackra/native-spotlight"]
 */
export const withNativeSpotlight: ConfigPlugin = (config) => config;
