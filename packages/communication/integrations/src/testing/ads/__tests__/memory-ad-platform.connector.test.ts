/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryAdPlatform`: a conversion is kept once per `eventId`, add and remove change only the
 *          members given, replace sets the whole audience, and a member with no key is refused by its index.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0266 (decision 2); STA-793.
 */
import { describe, expect, it } from "@stackra/testing";

import type { ConversionEvent } from "#contracts/index";
import { MemoryAdPlatform } from "#testing/ads/memory-ad-platform.connector";

const purchase: ConversionEvent = {
  eventId: "order_1",
  name: "purchase",
  occurredAt: new Date("2026-10-28T09:00:00Z"),
  person: { email: "a".repeat(64) },
};

describe(MemoryAdPlatform, () => {
  it("keeps a conversion once per eventId", async () => {
    const ads = new MemoryAdPlatform();
    await ads.sendConversions([purchase]);
    await expect(ads.sendConversions([purchase])).resolves.toEqual({ received: 1, refused: [] });
    expect(ads.conversions).toEqual([purchase]);
  });

  it("adds, removes and replaces audience members, refusing an empty one", async () => {
    const ads = new MemoryAdPlatform();
    await ads.syncAudience("vip", [{ email: "e1" }, { phone: "p1" }], "add");
    await ads.syncAudience("vip", [{ email: "e1" }], "remove");
    expect([...ads.audience("vip").values()]).toEqual([{ phone: "p1" }]);
    await expect(ads.syncAudience("vip", [{ externalId: "x1" }, {}], "replace")).resolves.toEqual({
      received: 1,
      refused: [{ ref: "1", reason: "no match key" }],
    });
    expect([...ads.audience("vip").values()]).toEqual([{ externalId: "x1" }]);
    expect(ads.audience("other").size).toBe(0);
  });
});
