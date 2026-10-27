/**
 * Stackra file contract:
 * Purpose: unit tests of `regionalHostnameRequest`: create pins a hostname to the region key the market pack names,
 *          delete releases it, and a malformed region key or hostname is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0437 (decision 12).
 */
import { describe, expect, it } from "@stackra/testing";

import { thrownIssues } from "#core/__tests__/fixtures/thrown-issues.fixture";
import { regionalHostnameRequest } from "#core/functions/regional-hostname-request.function";

describe("regionalHostnameRequest", () => {
  it("creates and deletes a regional hostname", () => {
    expect(
      regionalHostnameRequest({
        action: "create",
        zoneId: "zone1",
        hostname: "shop.acme.example",
        regionKey: "eu",
      }),
    ).toEqual({
      method: "POST",
      path: "/zones/zone1/addressing/regional_hostnames",
      body: { hostname: "shop.acme.example", region_key: "eu" },
    });
    expect(
      regionalHostnameRequest({ action: "delete", zoneId: "zone1", hostname: "shop.acme.example" }),
    ).toEqual({
      method: "DELETE",
      path: "/zones/zone1/addressing/regional_hostnames/shop.acme.example",
    });
  });

  it("refuses a malformed hostname or region key", () => {
    expect(
      thrownIssues(() =>
        regionalHostnameRequest({
          action: "create",
          zoneId: "zone1",
          hostname: "x",
          regionKey: "E U",
        }),
      ).map((issue) => issue.path),
    ).toEqual(["hostname", "regionKey"]);
  });
});
