/**
 * Stackra file contract:
 * Purpose: unit tests of `cloudflareZone`: the zone is imported by its runway id; records are named in full, proxied
 *          by the edge rule only when their type can be, automatic in TTL when proxied, and adopted by id when they
 *          carry one; a Worker custom domain and the SaaS fallback origin sit on the zone; `proxy: none` proxies
 *          nothing unasked.
 * Boundary: test only; Pulumi under mocks, so no provider or cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (decision 6), ADR 0175 (decision 1), ADR 0290 (decisions 3
 *                     and 15), ADR 0284 (decision 9).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { ZONE_OPTIONS_SCHEMA } from "#core/constants/zone-options-schema.constant";
import { cloudflareZone } from "#node/functions/cloudflare-zone.function";
import {
  declaredAs,
  inputsByName,
  mockPulumi,
  settled,
  type DeclaredResource,
} from "#node/functions/__tests__/fixtures/pulumi-mocks.fixture";

let declared: DeclaredResource[];

beforeEach(async () => {
  declared = await mockPulumi();
});

const options = ZONE_OPTIONS_SCHEMA.parse({
  fallbackOrigin: "cname.figentra.com",
  records: {
    docs: { type: "CNAME", name: "docs.stackra", content: "figentra.mintlify.dev" },
    dkim: { type: "TXT", name: "resend._domainkey", content: "p=MIGf", proxied: true },
    apex: {
      type: "A",
      name: "@",
      content: "192.0.2.1",
      proxied: false,
      ttl: 3600,
      import: "rec-1",
    },
  },
  workers: { "static.stackra.figentra.com": { service: "stackra-static", import: "wd-1" } },
});

describe("cloudflareZone", () => {
  it("imports the zone and declares what sits on it", async () => {
    await settled(
      cloudflareZone({
        accountId: "acc-1",
        name: "figentra.com",
        zoneId: "zone-1",
        options,
        proxy: "all",
      }),
    );

    expect(declaredAs(declared, "cloudflare:index/zone:Zone")).toEqual([
      {
        type: "cloudflare:index/zone:Zone",
        name: "figentra.com",
        inputs: { account: { id: "acc-1" }, name: "figentra.com", type: "full" },
        importId: "zone-1",
      },
    ]);
    expect(inputsByName(declared, "cloudflare:index/dnsRecord:DnsRecord")).toEqual({
      "figentra.com-record-docs": {
        zoneId: "zone-1",
        name: "docs.stackra.figentra.com",
        type: "CNAME",
        content: "figentra.mintlify.dev",
        proxied: true,
        ttl: 1,
      },
      "figentra.com-record-dkim": {
        zoneId: "zone-1",
        name: "resend._domainkey.figentra.com",
        type: "TXT",
        content: "p=MIGf",
        proxied: false,
        ttl: 1,
      },
      "figentra.com-record-apex": {
        zoneId: "zone-1",
        name: "figentra.com",
        type: "A",
        content: "192.0.2.1",
        proxied: false,
        ttl: 3600,
      },
    });
    expect(
      declaredAs(declared, "cloudflare:index/dnsRecord:DnsRecord")
        .filter((record) => record.importId !== undefined)
        .map((record) => [record.name, record.importId]),
    ).toEqual([["figentra.com-record-apex", "zone-1/rec-1"]]);
    expect(
      declaredAs(declared, "cloudflare:index/workersCustomDomain:WorkersCustomDomain"),
    ).toEqual([
      {
        type: "cloudflare:index/workersCustomDomain:WorkersCustomDomain",
        name: "static.stackra.figentra.com-worker",
        inputs: {
          accountId: "acc-1",
          hostname: "static.stackra.figentra.com",
          service: "stackra-static",
          zoneId: "zone-1",
        },
        importId: "acc-1/wd-1",
      },
    ]);
    expect(
      declaredAs(
        declared,
        "cloudflare:index/customHostnameFallbackOrigin:CustomHostnameFallbackOrigin",
      )[0]?.inputs,
    ).toEqual({ zoneId: "zone-1", origin: "cname.figentra.com" });
  });

  it("proxies nothing unasked when the edge proxies nothing", async () => {
    const plain = ZONE_OPTIONS_SCHEMA.parse({
      records: {
        docs: { type: "CNAME", name: "docs", content: "figentra.mintlify.dev", ttl: 300 },
      },
    });
    const zone = cloudflareZone({
      accountId: "acc-1",
      name: "acme.example",
      zoneId: "zone-2",
      options: plain,
      proxy: "none",
    });
    await settled(zone);

    expect(zone.workers).toEqual([]);
    expect(zone.fallbackOrigin).toBeUndefined();
    expect(declaredAs(declared, "cloudflare:index/dnsRecord:DnsRecord")[0]?.inputs).toMatchObject({
      proxied: false,
      ttl: 300,
    });
  });
});
