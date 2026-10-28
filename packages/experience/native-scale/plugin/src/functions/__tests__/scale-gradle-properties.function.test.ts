/**
 * Stackra file contract:
 * Purpose: proves `scaleGradleProperties` keeps the USB serial library only when `usb` is listed.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0478 (decisions 2 and 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { scaleGradleProperties } from "../scale-gradle-properties.function";

describe("scaleGradleProperties", () => {
  it("keeps the USB library only for usb", () => {
    expect(scaleGradleProperties(["ble", "usb"])).toEqual({ stackraNativeScaleUsb: "true" });
    expect(scaleGradleProperties(["ble", "spp"])).toEqual({ stackraNativeScaleUsb: "false" });
  });
});
