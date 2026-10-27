/**
 * Stackra file contract:
 * Purpose: unit tests of `parseCloudflareStack`: an empty config gets its defaults, a full config keeps its zones,
 *          buckets, tunnels and Access with the defaults filled, and tunnels without the dev zone, a Worker host or
 *          fallback origin outside its zone, a bad record name and an unknown key each fail naming their path; the
 *          edge Worker block gets its defaults and refuses shares that do not add up, a tunnel origin without its
 *          service, three signing keys and a regional host outside its zone.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (decision 6), ADR 0290 (decisions 1 to 6, 11 and 15),
 *                     ADR 0026.
 */
import { describe, expect, it } from "@stackra/testing";

import { thrownIssues } from "#core/__tests__/fixtures/thrown-issues.fixture";
import { parseCloudflareStack } from "#core/functions/parse-cloudflare-stack.function";

describe("parseCloudflareStack", () => {
  it("defaults an empty config", () => {
    expect(parseCloudflareStack({})).toEqual({ zones: {}, buckets: {}, tunnels: {} });
  });

  it("reads a full config and fills the defaults", () => {
    const stack = parseCloudflareStack({
      devZone: "figentra.cloud",
      zones: {
        "figentra.com": {
          plan: "pro",
          fallbackOrigin: "cname.figentra.com",
          records: {
            docs: { type: "CNAME", name: "docs.stackra", content: "figentra.mintlify.dev" },
            dkim: { type: "TXT", name: "resend._domainkey", content: "p=MIGf", import: "rec123" },
          },
          workers: { "static.stackra.figentra.com": { service: "stackra-static" } },
        },
        "figentra.cloud": { edge: false },
      },
      buckets: { "turbo-cache": { expireDays: 7 } },
      tunnels: { akouta: { members: ["console"] }, box: {} },
      access: {
        githubOrganization: "figentra",
        identityProviderId: "ref:cloudflare.access.github",
        serviceTokens: ["box"],
      },
    });

    expect(stack.zones["figentra.com"]?.plan).toBe("pro");
    expect(stack.zones["figentra.com"]?.edge).toBe(true);
    expect(stack.zones["figentra.com"]?.records["docs"]?.ttl).toBe(1);
    expect(stack.zones["figentra.cloud"]).toEqual({
      plan: "free",
      edge: false,
      records: {},
      workers: {},
      regional: {},
    });
    expect(stack.buckets).toEqual({ "turbo-cache": { expireDays: 7 } });
    expect(stack.tunnels).toEqual({ akouta: { members: ["console"] }, box: {} });
    expect(stack.access).toEqual({
      githubOrganization: "figentra",
      identityProviderId: "ref:cloudflare.access.github",
      sessionDuration: "24h",
      operatorUris: [],
      bypass: [],
      serviceTokens: ["box"],
    });
  });

  it("names each invalid path", () => {
    const issues = thrownIssues(() =>
      parseCloudflareStack(
        {
          tunnels: { akouta: {} },
          zones: {
            "figentra.com": {
              records: { bad: { type: "A", name: "Not A Name", content: "192.0.2.1" } },
              workers: { "static.example.org": { service: "stackra-static" } },
              fallbackOrigin: "cname.example.org",
            },
          },
          extra: true,
        },
        "Pulumi.core.yaml",
      ),
    );

    expect(issues.map((issue) => issue.path)).toEqual(["zones.figentra.com.records.bad.name", ""]);
  });

  it("checks the dev zone and the zone of each host once the shape is valid", () => {
    const issues = thrownIssues(() =>
      parseCloudflareStack({
        tunnels: { akouta: {} },
        zones: {
          "figentra.com": {
            workers: { "static.example.org": { service: "stackra-static" } },
            fallbackOrigin: "cname.example.org",
          },
        },
      }),
    );

    expect(issues.map((issue) => issue.path)).toEqual([
      "devZone",
      "zones.figentra.com.workers.static.example.org",
      "zones.figentra.com.fallbackOrigin",
    ]);
  });

  it("defaults the edge Worker block", () => {
    expect(
      parseCloudflareStack({ edgeWorker: { script: "figentra-edge", signingKeys: ["k1"] } })
        .edgeWorker,
    ).toEqual({
      script: "figentra-edge",
      namespaces: { edge: {} },
      routes: {},
      origins: {},
      signingKeys: ["k1"],
    });
  });

  it("refuses a bad edge Worker block and a foreign regional host", () => {
    const issues = thrownIssues(() =>
      parseCloudflareStack({
        edgeWorker: {
          script: "figentra-edge",
          rollout: [
            { version: "a", percent: 10 },
            { version: "b", percent: 80 },
          ],
          origins: { eu: { hostname: "api.figentra.com", lock: "tunnel" } },
          signingKeys: ["k1", "k2", "k3"],
        },
      }),
    );
    expect(issues.map((issue) => issue.path)).toEqual([
      "edgeWorker.rollout",
      "edgeWorker.origins.eu.service",
      "edgeWorker.signingKeys",
    ]);
    expect(
      thrownIssues(() =>
        parseCloudflareStack({
          zones: { "figentra.com": { regional: { "api.example.org": "eu" } } },
        }),
      ).map((issue) => issue.path),
    ).toEqual(["zones.figentra.com.regional.api.example.org"]);
  });
});
