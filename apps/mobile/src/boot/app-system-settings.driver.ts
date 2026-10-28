/**
 * Stackra file contract:
 * Purpose: `AppSystemSettingsDriver`, this app's `SystemSettings` driver: @stackra/platform's Expo driver over the
 *          three Expo libraries the app ships (expo-tracking-transparency, expo-battery, expo-background-task).
 * Boundary: declares the modules only; every read is the base driver's. The libraries are the app's own dependencies
 *           because an Expo module must be to be linked (ADR 0478: Expo's libraries, no hand-written native code).
 * Runtime: react-native
 * Governing contract: ADR 0250 (2026-10-29 note); ADR 0071 (decision 4: ATT); ADR 0007 (documentation).
 */
import { ExpoSystemSettingsDriver } from "@stackra/platform/native";
import type { ExpoSystemModules } from "@stackra/platform/native";
import * as BackgroundTask from "expo-background-task";
import * as Battery from "expo-battery";
import * as TrackingTransparency from "expo-tracking-transparency";

/** The phone's system settings, read through the Expo libraries this app ships. */
export class AppSystemSettingsDriver extends ExpoSystemSettingsDriver {
  /** The Expo libraries the base driver reads through. */
  protected readonly modules: ExpoSystemModules = {
    trackingTransparency: TrackingTransparency,
    battery: Battery,
    backgroundTask: BackgroundTask,
  };
}
