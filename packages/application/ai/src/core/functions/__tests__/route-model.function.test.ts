/**
 * Stackra file contract:
 * Purpose: unit tests of `routeModel`: the tenant's own rows first, in-region before any fallback, a fallback
 *          disclosed and skipped without its opt-in, strict in-region and an in-region data class never falling back,
 *          zero-retention and enabled-provider limits per data class, and a closed class refused.
 * Boundary: test only; the regions and providers are test data, not shipped defaults.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0156 (decision 2); ADR 0360 (decisions 14 and 15).
 */
import { describe, expect, it } from "@stackra/testing";

import { routeModel } from "#core/functions/route-model.function";
import type { ModelRoute } from "#core/types/model-route.type";
import type { RouteTable } from "#core/types/route-table.type";

const cloud: ModelRoute = {
  task: "chat",
  provider: "cloud-a",
  model: "a-1",
  regions: ["eu"],
  zeroRetention: false,
};
const sealed: ModelRoute = {
  task: "chat",
  provider: "cloud-b",
  model: "b-1",
  regions: ["eu", "far"],
  zeroRetention: true,
};
const local: ModelRoute = {
  task: "chat",
  provider: "local",
  model: "l-1",
  regions: ["home"],
  zeroRetention: true,
};

const table: RouteTable = {
  routes: [cloud, sealed],
  regions: [{ region: "home", fallback: ["far", "eu"], optInRequired: ["far"] }],
  dataClasses: [
    { dataClass: "health", inRegionOnly: true, zeroRetentionOnly: true, providers: ["local"] },
    { dataClass: "closed", inRegionOnly: true, zeroRetentionOnly: true, providers: [] },
    { dataClass: "sensitive", inRegionOnly: false, zeroRetentionOnly: true },
  ],
};

describe("routeModel", () => {
  it("always refuses a credential, even with no rule for it (ADR 0494)", () => {
    expect(routeModel({ task: "chat", region: "eu", dataClass: "credential" }, table)).toEqual({
      kind: "refused",
      reason: "class_closed",
    });
  });

  it("routes in-region by row order, the tenant's rows first", () => {
    expect(routeModel({ task: "chat", region: "eu" }, table)).toEqual({
      kind: "routed",
      route: cloud,
      region: "eu",
      disclosed: false,
    });
    expect(routeModel({ task: "chat", region: "eu", overrides: [sealed] }, table)).toMatchObject({
      route: sealed,
    });
  });

  it("falls back in the rule's order, disclosed, skipping an opt-in jurisdiction without the opt-in", () => {
    expect(routeModel({ task: "chat", region: "home" }, table)).toEqual({
      kind: "routed",
      route: cloud,
      region: "eu",
      disclosed: true,
    });
    expect(routeModel({ task: "chat", region: "home", optIns: ["far"] }, table)).toEqual({
      kind: "routed",
      route: sealed,
      region: "far",
      disclosed: true,
    });
  });

  it("never falls back for a strict tenant or a region with no rule", () => {
    expect(routeModel({ task: "chat", region: "home", strictInRegion: true }, table)).toEqual({
      kind: "refused",
      reason: "no_route",
    });
    expect(routeModel({ task: "chat", region: "nowhere" }, table).kind).toBe("refused");
  });

  it("keeps a data class to its enabled, zero-retention, in-region providers", () => {
    expect(routeModel({ task: "chat", region: "home", dataClass: "health" }, table)).toEqual({
      kind: "refused",
      reason: "no_route",
    });
    expect(
      routeModel({ task: "chat", region: "home", dataClass: "health", overrides: [local] }, table),
    ).toMatchObject({ route: local, disclosed: false });
    expect(routeModel({ task: "chat", region: "eu", dataClass: "sensitive" }, table)).toMatchObject(
      {
        route: sealed,
      },
    );
  });

  it("refuses a class with no enabled provider and a task with no row", () => {
    expect(routeModel({ task: "chat", region: "eu", dataClass: "closed" }, table)).toEqual({
      kind: "refused",
      reason: "class_closed",
    });
    expect(routeModel({ task: "embed", region: "eu" }, table).kind).toBe("refused");
  });
});
