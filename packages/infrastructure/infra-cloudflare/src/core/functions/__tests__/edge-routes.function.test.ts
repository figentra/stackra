/**
 * Stackra file contract:
 * Purpose: unit tests of `edgeRoutes` and of the bare wildcard refusal in the edge Worker schema.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-267.
 */
import { describe, expect, it } from "@stackra/testing";
import type { RootRunway } from "@stackra/runway";

import { EDGE_WORKER_SCHEMA } from "#core/constants/edge-worker-schema.constant";
import { edgeRoutes } from "#core/functions/edge-routes.function";

const ROOT = {
  environments: {
    production: { domains: { zone: "figentra.com" } },
    staging: { domains: { zone: "figentra.com" } },
  },
  surfaces: { web: { host: "app.mezzora", hosts: [{ host: "mezzora.com." }] } },
} as unknown as RootRunway;

describe("edgeRoutes", () => {
  it("adds one route per host under a zone, once, after the hand-written ones", () => {
    expect(edgeRoutes(ROOT, { "figentra.com": ["x.figentra.com/*"] }, ["figentra.com"])).toEqual({
      "figentra.com": ["x.figentra.com/*", "app.mezzora.figentra.com/*"],
    });
  });
});

describe("EDGE_WORKER_SCHEMA", () => {
  const base = { script: "edge", signingKeys: ["k1"] };
  it("refuses a bare wildcard without exclusions and accepts it with them", () => {
    expect(
      EDGE_WORKER_SCHEMA.safeParse({ ...base, routes: { "figentra.com": ["*/*"] } }).success,
    ).toBe(false);
    expect(
      EDGE_WORKER_SCHEMA.safeParse({
        ...base,
        routes: { "figentra.com": ["*/*"] },
        exclusions: { "figentra.com": ["api.figentra.com/*"] },
      }).success,
    ).toBe(true);
  });
});
