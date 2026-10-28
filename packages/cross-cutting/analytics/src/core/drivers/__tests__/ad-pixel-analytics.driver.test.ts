/**
 * Stackra file contract:
 * Purpose: unit tests of `AdPixelAnalyticsDriver`: a tracked delivery a conversion names fires that conversion with the
 *          `ref` property's value as the shared dedup id; without the property the delivery's own id stands; other
 *          events, `identify` and `group` fire nothing; a pixel's rejection rejects the batch.
 * Boundary: test only; the pixel is a recording `AdPixel`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0355 (decision 1); analytics gap 12 (stackra-412).
 */
import { buildConfig } from "@stackra/config";
import { Driver } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { AnalyticsConfig } from "#config/analytics.config";
import { AnalyticsDeliveryKind } from "#contracts/enums/analytics-delivery-kind.enum";
import { AdPixel } from "#contracts/ports/ad-pixel.port";
import type { AdPixelEvent } from "#contracts/types/ad-pixel-event.type";
import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";
import { AdPixelAnalyticsDriver } from "#core/drivers/ad-pixel-analytics.driver";

/** Records every fired event. */
class RecordingPixel extends Driver(AdPixel) {
  readonly fired: AdPixelEvent[] = [];

  fire(event: AdPixelEvent): Promise<void> {
    this.fired.push(event);
    return Promise.resolve();
  }
}

/** A tracked delivery of `name` with `properties`. */
function delivery(
  name: string,
  properties: Record<string, unknown>,
  overrides: Partial<AnalyticsDelivery> = {},
): AnalyticsDelivery {
  return {
    eventId: "evt_01jb0000000000000000000001",
    name,
    properties,
    occurredAt: "2026-10-29T10:00:00.000Z",
    anonymousId: "anon_1",
    sessionId: "ses_1",
    context: { library: { name: "@stackra/analytics" } },
    ...overrides,
  };
}

/** The driver over `pixel`, with `checkout.completed` as `purchase` by `orderId`. */
function driverOf(pixel: AdPixel): AdPixelAnalyticsDriver {
  const config = buildConfig(AnalyticsConfig, {
    values: {
      conversions: [
        { event: "checkout.completed", name: "purchase", ref: "orderId" },
        { event: "lead.submitted", name: "lead" },
      ],
    },
  });
  return new AdPixelAnalyticsDriver(pixel, config);
}

describe(AdPixelAnalyticsDriver, () => {
  it("fires a named conversion with the ref value as its event id", async () => {
    const pixel = new RecordingPixel();
    await driverOf(pixel).send([delivery("checkout.completed", { orderId: "ord_1", total: 10 })]);
    expect(pixel.fired).toEqual([
      {
        name: "purchase",
        eventId: "ord_1",
        occurredAt: "2026-10-29T10:00:00.000Z",
        properties: { orderId: "ord_1", total: 10 },
      },
    ]);
  });

  it("uses the delivery's id when the conversion names no ref or the property is missing", async () => {
    const pixel = new RecordingPixel();
    await driverOf(pixel).send([
      delivery("lead.submitted", {}),
      delivery("checkout.completed", {}, { eventId: "evt_01jb0000000000000000000002" }),
    ]);
    expect(pixel.fired.map((event) => event.eventId)).toEqual([
      "evt_01jb0000000000000000000001",
      "evt_01jb0000000000000000000002",
    ]);
  });

  it("fires nothing for other events, identify or group", async () => {
    const pixel = new RecordingPixel();
    await driverOf(pixel).send([
      delivery("page.viewed", { path: "/" }),
      delivery("identify", {}, { kind: AnalyticsDeliveryKind.Identify }),
      delivery("checkout.completed", { orderId: "ord_1" }, { kind: AnalyticsDeliveryKind.Group }),
    ]);
    expect(pixel.fired).toEqual([]);
  });

  it("rejects when the pixel does, so the client retries", async () => {
    class DownPixel extends RecordingPixel {
      override fire(): Promise<void> {
        return Promise.reject(new Error("pixel blocked"));
      }
    }
    await expect(
      driverOf(new DownPixel()).send([delivery("checkout.completed", { orderId: "ord_1" })]),
    ).rejects.toThrow("pixel blocked");
  });
});
