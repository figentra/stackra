/**
 * Stackra file contract:
 * Purpose: unit tests of `ScaleTransport`: its wire values, which the config plugin's `transports` share.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0478 (decision 5).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ScaleTransport } from "#core/enums/scale-transport.enum";

describe("ScaleTransport", () => {
  it("keeps its wire values", () => {
    expect(Enum.values(ScaleTransport)).toEqual(["ble", "spp", "usb"]);
  });
});
