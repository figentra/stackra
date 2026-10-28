/**
 * Stackra file contract:
 * Purpose: the `none` driver of the `AdPixel` port, the default: fires nothing, so the `ad-pixel` analytics driver is
 *          inert until a host binds a vendor pixel driver.
 * Boundary: stateless.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (a driver is named by its class: `none`); analytics gap 12 (stackra-412).
 */
import { Driver } from "@stackra/container";

import { AdPixel } from "#contracts/ports/ad-pixel.port";
import type { AdPixelEvent } from "#contracts/types/ad-pixel-event.type";

/**
 * Fires nothing.
 *
 * @example
 * await new NoneAdPixelDriver().fire(event); // resolves, sends nothing
 */
export class NoneAdPixelDriver extends Driver(AdPixel) {
  /** Drops `event`. */
  fire(_event: AdPixelEvent): Promise<void> {
    return Promise.resolve();
  }
}
