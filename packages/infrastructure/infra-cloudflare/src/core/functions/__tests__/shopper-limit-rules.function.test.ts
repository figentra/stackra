/**
 * Stackra file contract:
 * Purpose: unit tests of `shopperLimitRules`: one block rule per hot-item limit, matching the campaign host and the
 *          item path, counted per shopper cookie per data centre; a header key is lower-cased; no limit, no rule.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0402.
 */
import { describe, expect, it } from "@stackra/testing";

import { STOREFRONT_SETTINGS } from "#core/__tests__/fixtures/storefront.fixture";
import { parseStorefront } from "#core/functions/parse-storefront.function";
import { shopperLimitRules } from "#core/functions/shopper-limit-rules.function";

describe("shopperLimitRules", () => {
  it("limits each hot item per shopper", () => {
    const rules = shopperLimitRules(parseStorefront(STOREFRONT_SETTINGS));
    expect(rules).toHaveLength(2);
    expect(rules[0]).toEqual({
      action: "block",
      expression:
        '(http.host eq "shop.figentra.com" and starts_with(http.request.uri.path, "/products/sneaker-1"))',
      description: "spring-drop: 5 per 60s per shopper on /products/sneaker-1",
      ratelimit: {
        characteristics: ["cf.colo.id", 'http.request.cookies["shopper_id"]'],
        period: 60,
        requestsPerPeriod: 5,
        mitigationTimeout: 60,
      },
    });
  });

  it("keys a header shopper by its lower-cased name and makes no rule without a limit", () => {
    const policy = parseStorefront({
      ...STOREFRONT_SETTINGS,
      shopper: { by: "header", name: "X-Shopper" },
    });
    expect(shopperLimitRules(policy)[0]?.ratelimit.characteristics).toEqual([
      "cf.colo.id",
      'http.request.headers["x-shopper"]',
    ]);
    expect(shopperLimitRules(parseStorefront({ ...STOREFRONT_SETTINGS, campaigns: {} }))).toEqual(
      [],
    );
  });
});
