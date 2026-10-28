/**
 * Stackra file contract:
 * Purpose: unit tests of `NoneAdPixelDriver`: an `AdPixel` that fires nothing and resolves.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0263; analytics gap 12 (stackra-412).
 */
import { describe, expect, it } from "@stackra/testing";

import { AdPixel } from "#contracts/ports/ad-pixel.port";
import { NoneAdPixelDriver } from "#core/drivers/none-ad-pixel.driver";

describe(NoneAdPixelDriver, () => {
  it("is an AdPixel that resolves without firing", async () => {
    const pixel = new NoneAdPixelDriver();
    expect(pixel).toBeInstanceOf(AdPixel);
    await expect(
      pixel.fire({ name: "purchase", eventId: "ord_1", occurredAt: "", properties: {} }),
    ).resolves.toBeUndefined();
  });
});
