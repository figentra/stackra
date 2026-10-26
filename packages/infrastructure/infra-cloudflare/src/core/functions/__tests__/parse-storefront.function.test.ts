/**
 * Stackra file contract:
 * Purpose: unit tests of `parseStorefront`: campaign settings parse with the path default; a waiting room under
 *          Cloudflare's floors or ending before it starts, a period the edge does not accept and a path with a quote
 *          are refused with their `storefront.` paths.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0402.
 */
import { describe, expect, it } from "@stackra/testing";

import { STOREFRONT_SETTINGS } from "#core/__tests__/fixtures/storefront.fixture";
import { thrownIssues } from "#core/__tests__/fixtures/thrown-issues.fixture";
import { parseStorefront } from "#core/functions/parse-storefront.function";

describe("parseStorefront", () => {
  it("parses the campaign settings with their defaults", () => {
    const policy = parseStorefront(STOREFRONT_SETTINGS);
    expect(policy.shopper).toEqual({ by: "cookie", name: "shopper_id" });
    expect(policy.campaigns["quiet"]).toMatchObject({ path: "/", limits: [] });
    expect(policy.campaigns["spring-drop"]?.waitingRoom?.enabled).toBe(true);
  });

  it("refuses settings the edge cannot hold", () => {
    const drop = STOREFRONT_SETTINGS.campaigns["spring-drop"];
    const paths = thrownIssues(() =>
      parseStorefront({
        ...STOREFRONT_SETTINGS,
        campaigns: {
          "spring-drop": {
            ...drop,
            waitingRoom: { ...drop.waitingRoom, totalActiveUsers: 50 },
            limits: [
              { path: '/products/"x', requests: 5, periodSeconds: 60 },
              { path: "/cart", requests: 5, periodSeconds: 45 },
            ],
          },
        },
      }),
    ).map((issue) => issue.path);
    expect(paths.sort()).toEqual([
      "storefront.campaigns.spring-drop.limits.0.path",
      "storefront.campaigns.spring-drop.limits.1.periodSeconds",
      "storefront.campaigns.spring-drop.waitingRoom.totalActiveUsers",
    ]);
  });

  it("refuses a waiting room that ends before it starts", () => {
    const drop = STOREFRONT_SETTINGS.campaigns["spring-drop"];
    const paths = thrownIssues(() =>
      parseStorefront({
        ...STOREFRONT_SETTINGS,
        campaigns: {
          "spring-drop": {
            ...drop,
            waitingRoom: { ...drop.waitingRoom, endsAt: "2026-10-31T09:00:00Z" },
          },
        },
      }),
    ).map((issue) => issue.path);
    expect(paths).toEqual(["storefront.campaigns.spring-drop.waitingRoom.endsAt"]);
  });
});
