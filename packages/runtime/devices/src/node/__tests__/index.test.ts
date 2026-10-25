/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: the `devices.device.acknowledged` query and its two schemas
 *          are exported, nothing else is.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/devices/node", () => {
  it("exports exactly the acknowledged query and its schemas", () => {
    expect(Object.keys(node).sort()).toEqual([
      "DeviceAcknowledgedInput",
      "DeviceAcknowledgedOutput",
      "DeviceAcknowledgedQuery",
    ]);
  });
});
