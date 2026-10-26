/**
 * Stackra file contract:
 * Purpose: unit tests of `storefrontEdge` under Pulumi's mocks: a campaign with its room on gets a waiting room and an
 *          event over its window (prequeue included), a campaign with its room off gets both suspended, and the hot-item
 *          rules are returned for the zone's rate-limit entry point, where `zoneEdge` appends them after the per-IP
 *          limit.
 * Boundary: test only; Pulumi under mocks, so no provider or cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0402.
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { rootRunway, TEMPLATE_EDGE } from "#core/__tests__/fixtures/root-runway.fixture";
import { STOREFRONT_SETTINGS } from "#core/__tests__/fixtures/storefront.fixture";
import { parseEdge } from "#core/functions/parse-edge.function";
import { parseStorefront } from "#core/functions/parse-storefront.function";
import { storefrontEdge } from "#node/functions/storefront-edge.function";
import { zoneEdge } from "#node/functions/zone-edge.function";
import {
  inputsByName,
  mockPulumi,
  settled,
  type DeclaredResource,
} from "#node/functions/__tests__/fixtures/pulumi-mocks.fixture";

let declared: DeclaredResource[];

beforeEach(async () => {
  declared = await mockPulumi();
});

const policy = parseStorefront(STOREFRONT_SETTINGS);

describe("storefrontEdge", () => {
  it("opens the drop's waiting room over its window and suspends the quiet one", async () => {
    const storefront = storefrontEdge({ name: "figentra.com", zoneId: "zone-1", policy });
    await settled(storefront);

    const rooms = inputsByName(declared, "cloudflare:index/waitingRoom:WaitingRoom");
    expect(rooms["figentra.com-spring-drop"]).toMatchObject({
      zoneId: "zone-1",
      name: "spring-drop",
      host: "shop.figentra.com",
      path: "/drops/spring",
      totalActiveUsers: 500,
      newUsersPerMinute: 200,
      sessionDuration: 10,
      queueAll: false,
      suspended: false,
    });
    expect(rooms["figentra.com-quiet"]).toMatchObject({ path: "/", suspended: true });
    const events = inputsByName(declared, "cloudflare:index/waitingRoomEvent:WaitingRoomEvent");
    expect(events["figentra.com-spring-drop"]).toMatchObject({
      eventStartTime: "2026-11-01T06:00:00.000Z",
      eventEndTime: "2026-11-01T18:00:00.000Z",
      prequeueStartTime: "2026-11-01T05:30:00.000Z",
      suspended: false,
    });
    expect(events["figentra.com-quiet"]).toMatchObject({ suspended: true });
    expect(storefront.rules).toHaveLength(2);
  });

  it("puts the hot-item rules after the per-IP limit in the zone's one rate-limit ruleset", async () => {
    const { rules } = storefrontEdge({ name: "figentra.com", zoneId: "zone-1", policy });
    await settled(
      zoneEdge({
        name: "figentra.com",
        zoneId: "zone-1",
        plan: "pro",
        edge: parseEdge(rootRunway({ edge: TEMPLATE_EDGE })),
        shopperRules: rules,
      }),
    );

    const ruleset = inputsByName(declared, "cloudflare:index/ruleset:Ruleset")[
      "figentra.com-rate-limit"
    ];
    const descriptions = (
      (ruleset?.["rules"] ?? []) as { description: string; enabled: boolean }[]
    ).map((rule) => [rule.description, rule.enabled]);
    expect(descriptions).toEqual([
      ["Coarse per-IP limit; per-area limits are the service pipeline's (ADR 0217)", true],
      ["spring-drop: 5 per 60s per shopper on /products/sneaker-1", true],
      ["spring-drop: 2 per 60s per shopper on /cart/add/sneaker-1", true],
    ]);
  });
});
