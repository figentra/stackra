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

vi.mock("expo-notifications", () => ({}));
vi.mock("expo-constants", () => ({ default: {} }));
vi.mock("react-native", () => ({ Linking: {}, Platform: {}, Share: {} }));
vi.mock("@react-native-community/netinfo", () => ({ default: {} }));
vi.mock("expo-camera", () => ({ Camera: {}, CameraView: {} }));
vi.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
}));

describe("@stackra/platform/native", () => {
  it("exports exactly the Expo platform driver and the Expo and self-hosted push transports", () => {
    expect(Object.keys(native).sort()).toEqual([
      "ExpoPlatformDriver",
      "ExpoPushTransportDriver",
      "SelfHostedPushTransportDriver",
    ]);
  });
});
