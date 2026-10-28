/**
 * Stackra file contract:
 * Purpose: pins the exports of the `./testing` entry of @stackra/tenancy: the tenant id, actor and tenant call helpers.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as testing from "#testing/index";

describe("@stackra/tenancy/testing", () => {
  it("exports exactly its helpers", () => {
    expect(Object.keys(testing).sort()).toEqual([
      "fakeTenantId",
      "runAsTenant",
      "tenantActor",
      "tenantIsolationOptions",
    ]);
  });
});
