/**
 * Stackra file contract:
 * Purpose: unit tests of `DEVICE_ORDER`: the two header names, the acknowledged query's key and route, frozen.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0338 (decisions 1 and 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { DEVICE_ORDER } from "#contracts/constants/device-order.constant";

describe("DEVICE_ORDER", () => {
  it("names the headers and the acknowledged query, frozen", () => {
    expect(DEVICE_ORDER).toEqual({
      deviceHeader: "Stackra-Device",
      sequenceHeader: "Stackra-Device-Sequence",
      acknowledgedQuery: "devices.device.acknowledged@1",
      acknowledgedPath: "/devices/acknowledged",
    });
    expect(Object.isFrozen(DEVICE_ORDER)).toBe(true);
  });
});
