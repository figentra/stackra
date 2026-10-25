/**
 * Stackra file contract:
 * Purpose: unit tests of `DeviceStatus`: active or retired.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0361 (decision 7).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { DeviceStatus } from "#contracts/enums/device-status.enum";

describe("DeviceStatus", () => {
  it("is active or retired", () => {
    expect(Enum.values(DeviceStatus)).toEqual(["active", "retired"]);
  });
});
