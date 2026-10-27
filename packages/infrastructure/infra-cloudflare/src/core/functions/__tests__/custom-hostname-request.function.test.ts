/**
 * Stackra file contract:
 * Purpose: unit tests of `customHostnameRequest`: create carries a TXT-validated DV certificate, TLS 1.2 by default
 *          and the scope id as custom metadata; get and delete address the hostname by id; a bad hostname, empty
 *          scope or malformed id is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0276 (decisions 4 and 8), ADR 0437 (decision 10).
 */
import { describe, expect, it } from "@stackra/testing";

import { thrownIssues } from "#core/__tests__/fixtures/thrown-issues.fixture";
import { customHostnameRequest } from "#core/functions/custom-hostname-request.function";

describe("customHostnameRequest", () => {
  it("creates a hostname for a scope", () => {
    expect(
      customHostnameRequest({
        action: "create",
        zoneId: "zone1",
        hostname: "shop.acme.example",
        scopeId: "scp_01J",
      }),
    ).toEqual({
      method: "POST",
      path: "/zones/zone1/custom_hostnames",
      body: {
        hostname: "shop.acme.example",
        ssl: { method: "txt", type: "dv", settings: { min_tls_version: "1.2" } },
        custom_metadata: { scope: "scp_01J" },
      },
    });
  });

  it("reads and deletes by id", () => {
    expect(
      customHostnameRequest({ action: "get", zoneId: "zone1", customHostnameId: "ch1" }),
    ).toEqual({
      method: "GET",
      path: "/zones/zone1/custom_hostnames/ch1",
    });
    expect(
      customHostnameRequest({ action: "delete", zoneId: "zone1", customHostnameId: "ch1" }),
    ).toEqual({ method: "DELETE", path: "/zones/zone1/custom_hostnames/ch1" });
  });

  it("refuses malformed input", () => {
    expect(
      thrownIssues(() =>
        customHostnameRequest({
          action: "create",
          zoneId: "z/1",
          hostname: "Shop.Acme",
          scopeId: "",
        }),
      ).map((issue) => issue.path),
    ).toEqual(["zoneId", "hostname", "scopeId"]);
    expect(
      thrownIssues(() =>
        customHostnameRequest({ action: "delete", zoneId: "zone1", customHostnameId: "../x" }),
      ).map((issue) => issue.path),
    ).toEqual(["customHostnameId"]);
  });
});
