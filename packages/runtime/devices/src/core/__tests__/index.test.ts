/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the registry row's configuration, HTTP drivers, refusals and hub
 *          routes are exported, nothing else is (the ports, `hubSender` and the command-list schema are not).
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
      "DEVICE_HUB_PATHS",
      "DeviceHubRefusedError",
      "DeviceUnauthorizedError",
      "DevicesConfig",
      "DevicesConfig$",
      "DevicesOptions",
      "HttpDeviceCommandsDriver",
      "HttpDeviceTelemetryDriver",
    ]);
  });

  it("exports the shipped schema under its generated name", () => {
    expect(devices.DevicesConfig$).toBe(DEVICES_CONFIG_SCHEMA);
  });
});
