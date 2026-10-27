/**
 * Stackra file contract:
 * Purpose: unit tests of `POS_DEVICE_FAMILIES`: exactly the Sunmi, PAX and iMin families, each with its Expo module
 *          name and the ready status its recorded SDK fixture reports, frozen.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0458; ADR 0459; ADR 0460.
 */
import { describe, expect, it } from "@stackra/testing";

import { POS_DEVICE_FAMILIES } from "#native/constants/pos-device-families.constant";
import { POS_DEVICE_SDK } from "#native/__tests__/pos-device-sdk.fixture";

describe("POS_DEVICE_FAMILIES", () => {
  it("names the three families and their modules", () => {
    expect(POS_DEVICE_FAMILIES).toEqual({
      sunmi: { name: "sunmi", module: "StackraSunmi", printerReady: [1] },
      pax: { name: "pax", module: "StackraPax", printerReady: [0] },
      imin: { name: "imin", module: "StackraImin", printerReady: [0] },
    });
    expect(Object.isFrozen(POS_DEVICE_FAMILIES)).toBe(true);
  });

  it("treats only the recorded ready status as ready", () => {
    for (const family of Object.values(POS_DEVICE_FAMILIES)) {
      const recorded = POS_DEVICE_SDK.status[family.name];
      expect(family.printerReady).toContain(recorded.ready);
      for (const status of [recorded.outOfPaper, recorded.overheated, recorded.fault])
        expect(family.printerReady).not.toContain(status);
    }
  });
});
