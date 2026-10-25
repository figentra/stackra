/**
 * Stackra file contract:
 * Purpose: unit tests of `DEVICE_HUB_PATHS`: the three routes of the endpoint convention, an encoded command id, and a
 *          frozen object.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0235 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { DEVICE_HUB_PATHS } from "#core/constants/device-hub-paths.constant";

describe("DEVICE_HUB_PATHS", () => {
  it("names the report, pending and acknowledge routes", () => {
    expect(DEVICE_HUB_PATHS.report).toBe("/devices/report");
    expect(DEVICE_HUB_PATHS.commands).toBe("/device-commands");
    expect(DEVICE_HUB_PATHS.acknowledge("cmd_1")).toBe("/device-commands/cmd_1/acknowledge");
  });

  it("names the pairing routes and encodes a pairing id", () => {
    expect(DEVICE_HUB_PATHS.pairings).toBe("/device-pairings");
    expect(DEVICE_HUB_PATHS.pairing("pr/1")).toBe("/device-pairings/pr%2F1");
  });

  it("encodes a command id so it stays one segment", () => {
    expect(DEVICE_HUB_PATHS.acknowledge("a/b?c")).toBe("/device-commands/a%2Fb%3Fc/acknowledge");
  });

  it("is frozen", () => {
    expect(Object.isFrozen(DEVICE_HUB_PATHS)).toBe(true);
  });
});
