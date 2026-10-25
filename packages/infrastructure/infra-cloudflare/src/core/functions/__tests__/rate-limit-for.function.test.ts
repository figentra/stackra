/**
 * Stackra file contract:
 * Purpose: unit tests of `rateLimitFor`: no per-IP limit gives no rule; Free scales the runway's 600 per minute to its
 *          10-second window, Pro keeps the minute, and a window shorter than every allowed one takes the shortest.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0217 (decision 2), ADR 0290 (decision 13).
 */
import { describe, expect, it } from "@stackra/testing";

import { rootRunway } from "#core/__tests__/fixtures/root-runway.fixture";
import { ZonePlan } from "#core/enums/zone-plan.enum";
import { parseEdge } from "#core/functions/parse-edge.function";
import { rateLimitFor } from "#core/functions/rate-limit-for.function";

/** The edge policy with a per-IP limit of `requests` per `periodSeconds`. */
const limited = (requests: number, periodSeconds: number) =>
  parseEdge(rootRunway({ edge: { rateLimit: { perIp: { requests, periodSeconds } } } }));

describe("rateLimitFor", () => {
  it("gives no rule without a per-IP limit", () => {
    expect(rateLimitFor(parseEdge(rootRunway()), ZonePlan.Pro)).toBeNull();
  });

  it("keeps the rate in the window each plan allows", () => {
    expect(rateLimitFor(limited(600, 60), ZonePlan.Free)).toEqual({
      period: 10,
      requestsPerPeriod: 100,
    });
    expect(rateLimitFor(limited(600, 60), ZonePlan.Pro)).toEqual({
      period: 60,
      requestsPerPeriod: 600,
    });
    expect(rateLimitFor(limited(600, 300), ZonePlan.Pro)).toEqual({
      period: 60,
      requestsPerPeriod: 120,
    });
  });

  it("takes the shortest window below every allowed one and never goes under one request", () => {
    expect(rateLimitFor(limited(5, 5), ZonePlan.Free)).toEqual({
      period: 10,
      requestsPerPeriod: 10,
    });
    expect(rateLimitFor(limited(1, 3600), ZonePlan.Free)).toEqual({
      period: 10,
      requestsPerPeriod: 1,
    });
  });
});
