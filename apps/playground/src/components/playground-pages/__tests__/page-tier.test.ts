/**
 * Stackra file contract:
 * Purpose: proves a page's tier is Pro exactly when its path starts with `/pro-`, and that each tier filter shows the
 *          pages of its own tier (`all` shows both).
 * Boundary: pure functions; no DOM, no network.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0022 (test placement).
 */
// @covers sta-416:FR-001
import { TIER_FILTERS } from "#src/components/playground-pages/tier-filters.constant";
import { tierOf } from "#src/components/playground-pages/tier-of.function";
import { matchesTier } from "#src/components/playground-pages/matches-tier.function";

describe("tierOf", () => {
  it("is Pro for a path that starts with /pro-", () => {
    expect(tierOf("/pro-kpi")).toBe("Pro");
    expect(tierOf("/pro-app-layout")).toBe("Pro");
  });

  it("is Free for every other path, including one that only contains pro", () => {
    expect(tierOf("/button")).toBe("Free");
    expect(tierOf("/professional")).toBe("Free");
    expect(tierOf("/radio-pro-group")).toBe("Free");
    expect(tierOf("/")).toBe("Free");
  });
});

describe("matchesTier", () => {
  it("shows every page under all, and only its own tier under free and pro", () => {
    expect(TIER_FILTERS).toEqual(["all", "free", "pro"]);
    expect(matchesTier("Free", "all")).toBe(true);
    expect(matchesTier("Pro", "all")).toBe(true);
    expect(matchesTier("Free", "free")).toBe(true);
    expect(matchesTier("Pro", "free")).toBe(false);
    expect(matchesTier("Free", "pro")).toBe(false);
    expect(matchesTier("Pro", "pro")).toBe(true);
  });
});
