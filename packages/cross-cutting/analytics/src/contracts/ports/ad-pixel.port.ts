/**
 * Stackra file contract:
 * Purpose: the `AdPixel` port: fires a conversion on the browser pixels of the ad platforms (Meta, TikTok, Snap,
 *          Google Ads) a deployment's `AdPlatform` Connections name. Config `analytics.adPixelDriver` picks the driver.
 * Boundary: an abstract class that is its own token. Only the `ad-pixel` analytics driver calls it, and only for a
 *           destination whose consent category (`marketing`) is granted, so a pixel never checks consent. Vendor pixel
 *           drivers, their scripts and pixel ids are OS integrations (ADR 0443 decision 7): one driver fans out to
 *           every pixel id its Connections hold. This package ships `none` only.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1 and 5); ADR 0443 (decision 7); ADR 0263; analytics gap 12 (stackra-412).
 */
import { Port } from "@stackra/contracts";

import type { AdPixelEvent } from "#contracts/types/ad-pixel-event.type";

/**
 * Fires conversions on browser ad pixels.
 *
 * @example
 * export class MetaAdPixelDriver extends Driver(AdPixel) {
 *   fire(event: AdPixelEvent): Promise<void> { ... } // fbq("track", "Purchase", params, { eventID: event.eventId })
 * }
 */
export abstract class AdPixel extends Port {
  /** Fires `event` on every pixel; rejects when it could not, and the delivery engine retries the batch. */
  abstract fire(event: AdPixelEvent): Promise<void>;
}
