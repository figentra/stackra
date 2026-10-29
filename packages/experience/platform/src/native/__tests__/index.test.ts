/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./native` entry: the platform driver and the two push transports the
 *          template's mobile wiring imports, and nothing else.
 * Boundary: test only; the Expo modules and react-native are mocked so the barrel loads in node.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import * as native from "#native/index";

vi.mock("expo-notifications", () => ({ AndroidImportance: {} }));
vi.mock("expo-constants", () => ({ default: {} }));
vi.mock("react-native", () => ({
  AppState: {},
  Linking: {},
  PermissionsAndroid: {},
  Platform: {},
  Pressable: {},
  Share: {},
  StyleSheet: { create: (styles: object) => styles },
  Text: {},
  View: {},
}));
vi.mock("expo-local-authentication", () => ({ SecurityLevel: {} }));
vi.mock("@react-native-community/netinfo", () => ({ addEventListener: () => () => undefined }));
vi.mock("expo-tracking-transparency", () => ({}));
vi.mock("expo-alternate-app-icons", () => ({}));
vi.mock("expo-battery", () => ({}));
vi.mock("expo-background-task", () => ({ BackgroundTaskStatus: { Available: 2 } }));
vi.mock("expo-camera", () => ({ Camera: {}, CameraView: {} }));
vi.mock("expo-location", () => ({}));
vi.mock("expo-media-library", () => ({}));
vi.mock("expo-widgets", () => ({
  addPushToStartTokenListener: () => ({ remove: () => undefined }),
  after: () => ({}),
  createLiveActivity: () => ({}),
  createWidget: () => ({}),
}));
vi.mock("@expo/ui/swift-ui", () => ({ HStack: () => null, Text: () => null, VStack: () => null }));
vi.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
}));

describe("@stackra/platform/native", () => {
  it("exports exactly the Expo drivers, the app lock gate, the self-hosted push transport and the channel creator", () => {
    expect(Object.keys(native).sort()).toEqual([
      "AppLockGate",
      "ExpoAppIconDriver",
      "ExpoAppLockDriver",
      "ExpoHomeWidgetsDriver",
      "ExpoLiveActivitiesDriver",
      "ExpoPlatformDriver",
      "ExpoPushTransportDriver",
      "ExpoSystemPermissionsDriver",
      "ExpoSystemSettingsDriver",
      "SelfHostedPushTransportDriver",
      "createNotificationChannels",
    ]);
  });
});
