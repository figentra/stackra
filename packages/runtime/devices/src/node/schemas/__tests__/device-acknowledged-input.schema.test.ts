/**
 * Stackra file contract:
 * Purpose: unit tests of `DeviceAcknowledgedInput`: empty for the calling device, or another device's id; an empty id
 *          is refused by its registered schema.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0338 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { DeviceAcknowledgedInput } from "#node/schemas/device-acknowledged-input.schema";

describe("DeviceAcknowledgedInput", () => {
  it("takes nothing or a device id", () => {
    expect(DeviceAcknowledgedInput.create({}).deviceId).toBeUndefined();
    expect(DeviceAcknowledgedInput.create({ deviceId: "dev_1" }).deviceId).toBe("dev_1");
    expect(() => DeviceAcknowledgedInput.create({ deviceId: "" })).toThrow();
  });
});
