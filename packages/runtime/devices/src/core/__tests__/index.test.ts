/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the registry row's configuration, HTTP drivers, refusals and hub
 *          routes, pairing code alphabet and generator are exported, nothing else is (the ports, `hubSender` and the
 *          command-list schema are not).
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import { DEVICES_CONFIG_SCHEMA } from "#core/constants/devices-config-schema.constant";
import * as devices from "#core/index";

describe("@stackra/devices", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(devices).sort()).toEqual([
      "BASE_DEVICE_CATALOGUE",
      "DEVICE_HUB_PATHS",
      "DEVICE_STORAGE_KEYS",
      "DeviceHubRefusedError",
      "DeviceUnauthorizedError",
      "DevicesConfig",
      "DevicesConfig$",
      "DevicesOptions",
      "HttpDeviceCommandsDriver",
      "HttpDevicePairingDriver",
      "HttpDeviceTelemetryDriver",
      "MemoryDeviceRegistryDriver",
      "PAIRING_CODE_ALPHABET",
      "PairingCodeInvalidError",
      "StoredDeviceCredentialDriver",
      "StoredDeviceIdentityDriver",
      "deviceCatalogueOf",
      "newPairingCode",
    ]);
  });

  it("exports the shipped schema under its generated name", () => {
    expect(devices.DevicesConfig$).toBe(DEVICES_CONFIG_SCHEMA);
  });
});
