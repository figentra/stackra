/**
 * Stackra file contract:
 * Purpose: the `ad-pixel` driver of the `AnalyticsDriver` port: each tracked delivery that `AnalyticsConfig.conversions`
 *          names fires its conversion on the bound `AdPixel`, with the shared dedup id the server conversion carries.
 * Boundary: listed as its own destination gated by `marketing` (`{ driver: "pixel", category: Marketing }`), so it
 *           runs only once the visitor granted marketing; it never checks consent. Every other delivery (an event no
 *           conversion names, `identify`, `group`) is dropped: a pixel takes conversions only. A conversion whose `ref`
 *           property is missing falls back to the delivery's `eventId` (counted once on the pixel, not deduplicated
 *           against a server conversion). A pixel's rejection rejects the batch and the client retries it.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1 and 5); ADR 0472 (decision 4); ADR 0355 (decision 1); analytics gap 12
 *                     (stackra-412).
 */
import { Driver } from "@stackra/container";

import type { AnalyticsConfig } from "#config/analytics.config";
import { AnalyticsDeliveryKind } from "#contracts/enums/analytics-delivery-kind.enum";
import type { AdPixel } from "#contracts/ports/ad-pixel.port";
import { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";

/**
 * Sends conversions to browser ad pixels.
 *
 * @example
 * const driver = new AdPixelAnalyticsDriver(pixel, buildConfig(AnalyticsConfig, { values: { conversions } }));
 * await driver.send(deliveries); // fires `purchase` for each `checkout.completed`
 */
export class AdPixelAnalyticsDriver extends Driver(AnalyticsDriver) {
  /** The bound pixel. */
  private readonly pixel: AdPixel;

  /** `conversions` maps event names to conversions. */
  private readonly config: AnalyticsConfig;

  /**
   * @param pixel - the bound `AdPixel` (`config:analytics.adPixelDriver`).
   * @param config - the analytics configuration.
   */
  constructor(pixel: AdPixel, config: AnalyticsConfig) {
    super();
    this.pixel = pixel;
    this.config = config;
  }

  /**
   * Fires the conversion of each tracked delivery a conversion names, in order.
   *
   * @throws Error when the pixel rejects, so the client retries the batch.
   */
  async send(deliveries: readonly AnalyticsDelivery[]): Promise<void> {
    for (const delivery of deliveries) {
      if ((delivery.kind ?? AnalyticsDeliveryKind.Track) !== AnalyticsDeliveryKind.Track) continue;
      const conversion = this.config.conversions.find((entry) => entry.event === delivery.name);
      if (conversion === undefined) continue;
      const ref = conversion.ref === undefined ? undefined : delivery.properties[conversion.ref];
      await this.pixel.fire({
        name: conversion.name,
        eventId:
          typeof ref === "string" || typeof ref === "number" ? String(ref) : delivery.eventId,
        occurredAt: delivery.occurredAt,
        properties: delivery.properties,
      });
    }
  }
}
