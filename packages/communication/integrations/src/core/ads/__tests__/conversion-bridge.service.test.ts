/**
 * Stackra file contract:
 * Purpose: unit tests of `ConversionBridge`: a consenting payload reaches the ad platform once per event id with the
 *          Connection's phone format, the provider is passed to the gateway, and without marketing consent nothing is
 *          sent and no Connection is looked up.
 * Boundary: test only; the gateway answers an in-memory ad platform.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0355 (decision 1); ADR 0472 (decision 4); analytics gap 12
 *                     (stackra-412).
 */
import { createHash } from "node:crypto";

import { describe, expect, it } from "@stackra/testing";

import type { AdBatchResult } from "#contracts/ads/ad-batch-result.type";
import type { AdPlatformConnector } from "#contracts/ads/ad-platform-connector.type";
import type { ConversionEvent } from "#contracts/ads/conversion-event.type";
import { ConversionBridge } from "#core/ads/conversion-bridge.service";
import type { Conversion } from "#core/ads/conversion.type";
import type { Connection } from "#core/bases/connection.base";
import { ConnectorGateway } from "#core/services/connector-gateway.service";
import type { ProviderResolver } from "#core/services/provider-resolver.service";
import type { ConnectorQuery } from "#core/types/connector-query.type";

const AT = new Date("2026-10-29T10:00:00.000Z");

const PURCHASE: Conversion = { name: "purchase", ref: "orderId", person: { phone: "phone" } };

/** An ad platform that keeps each conversion once per event id, as a platform dedups. */
class MemoryAdPlatform implements AdPlatformConnector {
  readonly conversions: ConversionEvent[] = [];

  sendConversions = (events: readonly ConversionEvent[]): Promise<AdBatchResult> => {
    for (const event of events)
      if (!this.conversions.some((seen) => seen.eventId === event.eventId))
        this.conversions.push(event);
    return Promise.resolve({ received: events.length, refused: [] });
  };

  syncAudience = (): Promise<AdBatchResult> => Promise.resolve({ received: 0, refused: [] });
}

/** A platform that hashes phones as digits. */
class DigitsPlatform extends MemoryAdPlatform {
  readonly phoneFormat = "digits" as const;
}

/** A gateway that answers `platform` and records each query. */
class FakeGateway extends ConnectorGateway {
  readonly queries: ConnectorQuery<AdPlatformConnector>[] = [];

  readonly platform: MemoryAdPlatform;

  constructor(platform: MemoryAdPlatform) {
    super({} as ProviderResolver);
    this.platform = platform;
  }

  override ads(
    query: ConnectorQuery<AdPlatformConnector> = {},
  ): Promise<Connection & AdPlatformConnector> {
    this.queries.push(query);
    return Promise.resolve(this.platform as unknown as Connection & AdPlatformConnector);
  }
}

/** A payload with marketing consent unless `granted` says otherwise. */
const placed = (granted: string[] = ["marketing"]) => ({
  orderId: "ord_1",
  phone: "+966500000000",
  consent: { snapshotId: "csn_1", granted },
});

describe(ConversionBridge, () => {
  it("sends the conversion once per event id with the Connection's phone format", async () => {
    const gateway = new FakeGateway(new DigitsPlatform());
    const bridge = new ConversionBridge(gateway);
    await expect(bridge.relay(PURCHASE, placed(), AT)).resolves.toEqual({
      received: 1,
      refused: [],
    });
    await bridge.relay(PURCHASE, placed(), AT);
    expect(gateway.platform.conversions).toHaveLength(1);
    expect(gateway.platform.conversions[0]?.person).toEqual({
      phone: createHash("sha256").update("966500000000").digest("hex"),
    });
    expect(gateway.queries[0]).toEqual({});
  });

  it("asks the gateway for the conversion's provider", async () => {
    const gateway = new FakeGateway(new MemoryAdPlatform());
    await new ConversionBridge(gateway).relay({ ...PURCHASE, provider: "meta" }, placed(), AT);
    expect(gateway.queries).toEqual([{ provider: "meta" }]);
  });

  it("sends nothing and looks nothing up without marketing consent", async () => {
    const gateway = new FakeGateway(new MemoryAdPlatform());
    await expect(
      new ConversionBridge(gateway).relay(PURCHASE, placed(["analytics"]), AT),
    ).resolves.toBeNull();
    expect(gateway.queries).toEqual([]);
    expect(gateway.platform.conversions).toEqual([]);
  });
});
