/**
 * Stackra file contract:
 * Purpose: unit tests of `cloudflareCoreStack`: every zone the root runway names is imported by its `ref:`-resolved
 *          id, the edge lands on edge zones only (a runway zone missing from the stack config gets the defaults), the
 *          tunnel exposes the members' dev ports on the dev zone under `<project>-<dev>`, Access guards the dev zone
 *          with the resolved identity provider, and the Turborepo cache bucket expires; a runway without a Cloudflare
 *          account, and a stack zone the runway does not name, fail before any resource is declared; a storefront on an
 *          edge zone gets its waiting rooms and hot-item limits, one on a non-edge zone or naming a foreign host fails.
 * Boundary: test only; Pulumi under mocks with an in-memory stack config, so no provider or cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (decisions 6 and 7), ADR 0290 (decisions 1 to 6 and 15),
 *                     ADR 0026, ADR 0217 (decision 3).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { rootRunway, TEMPLATE_EDGE } from "#core/__tests__/fixtures/root-runway.fixture";
import { STOREFRONT_SETTINGS } from "#core/__tests__/fixtures/storefront.fixture";
import { thrownIssues } from "#core/__tests__/fixtures/thrown-issues.fixture";
import { parseStorefront } from "#core/functions/parse-storefront.function";
import { parseCloudflareStack } from "#core/functions/parse-cloudflare-stack.function";
import { cloudflareCoreStack } from "#node/functions/cloudflare-core-stack.function";
import {
  declaredAs,
  inputsByName,
  mockPulumi,
  settled,
  type DeclaredResource,
} from "#node/functions/__tests__/fixtures/pulumi-mocks.fixture";

let declared: DeclaredResource[];

beforeEach(async () => {
  declared = await mockPulumi({
    "infra:cloudflare": JSON.stringify({
      accountId: "acc-1",
      zones: { com: "zone-com", cloud: "zone-cloud" },
    }),
    "infra:access": JSON.stringify({ github: "idp-1" }),
  });
});

const root = rootRunway({
  providers: {
    cloudflare: {
      accountId: "ref:cloudflare.accountId",
      zones: {
        "figentra.com": "ref:cloudflare.zones.com",
        "figentra.cloud": "ref:cloudflare.zones.cloud",
      },
    },
  },
  edge: TEMPLATE_EDGE,
});

const stack = parseCloudflareStack({
  devZone: "figentra.cloud",
  zones: { "figentra.cloud": { edge: false } },
  buckets: { "turbo-cache": { expireDays: 7 } },
  tunnels: { akouta: {} },
  access: { githubOrganization: "figentra", identityProviderId: "ref:access.github" },
});

describe("cloudflareCoreStack", () => {
  it("declares the core stack from the runway and the stack config", async () => {
    const core = cloudflareCoreStack({ root, stack, ports: { console: 5173 } });
    await settled(core);

    expect(
      Object.fromEntries(
        declaredAs(declared, "cloudflare:index/zone:Zone").map((zone) => [
          zone.name,
          zone.importId,
        ]),
      ),
    ).toEqual({ "figentra.com": "zone-com", "figentra.cloud": "zone-cloud" });
    expect(Object.keys(inputsByName(declared, "cloudflare:index/ruleset:Ruleset")).sort()).toEqual([
      "figentra.com-cache-bypass",
      "figentra.com-rate-limit",
      "figentra.com-waf",
    ]);
    expect(core.zones["figentra.cloud"]?.edge).toBeUndefined();
    expect(inputsByName(declared, "cloudflare:index/dnsRecord:DnsRecord")).toEqual({
      "tunnel-figentra-akouta-console-akouta.figentra.cloud": {
        zoneId: "zone-cloud",
        name: "console-akouta.figentra.cloud",
        type: "CNAME",
        content: "tunnel-figentra-akouta-id.cfargotunnel.com",
        proxied: true,
        ttl: 1,
        comment: "Dev tunnel figentra-akouta (ADR 0290 decision 5)",
      },
    });
    expect(
      inputsByName(
        declared,
        "cloudflare:index/zeroTrustAccessApplication:ZeroTrustAccessApplication",
      )["access-dev"],
    ).toMatchObject({ accountId: "acc-1", domain: "*.figentra.cloud", allowedIdps: ["idp-1"] });
    expect(
      inputsByName(declared, "cloudflare:index/r2BucketLifecycle:R2BucketLifecycle")[
        "r2-turbo-cache-lifecycle"
      ],
    ).toMatchObject({ accountId: "acc-1", bucketName: "turbo-cache" });
  });

  it("declares nothing beyond the zones when the stack config is empty", async () => {
    const core = cloudflareCoreStack({ root, stack: parseCloudflareStack({}) });
    await settled(core);

    expect(core.tunnels).toEqual({});
    expect(core.access).toBeUndefined();
    expect(core.buckets).toEqual({});
    expect(Object.keys(core.zones)).toEqual(["figentra.com", "figentra.cloud"]);
  });

  it("refuses a runway without a Cloudflare account and a zone the runway does not name", () => {
    expect(
      thrownIssues(() =>
        cloudflareCoreStack({
          root: rootRunway(),
          stack: parseCloudflareStack({ zones: { "example.org": {} } }),
        }),
      ).map((issue) => issue.path),
    ).toEqual(["providers.cloudflare.accountId", "providers.cloudflare.zones.example.org"]);
    expect(declared).toEqual([]);
  });

  it("puts a storefront's waiting rooms and hot-item limits on its edge zone", async () => {
    const core = cloudflareCoreStack({
      root,
      stack,
      storefront: { "figentra.com": parseStorefront(STOREFRONT_SETTINGS) },
    });
    await settled(core);

    expect(Object.keys(core.zones["figentra.com"]?.storefront ?? {})).toEqual([
      "spring-drop",
      "quiet",
    ]);
    const rules = inputsByName(declared, "cloudflare:index/ruleset:Ruleset")[
      "figentra.com-rate-limit"
    ]?.["rules"] as unknown[];
    expect(rules).toHaveLength(3);
  });

  it("refuses a storefront on a zone without the edge or with a host outside it", () => {
    const policy = parseStorefront(STOREFRONT_SETTINGS);
    expect(
      thrownIssues(() =>
        cloudflareCoreStack({ root, stack, storefront: { "figentra.cloud": policy } }),
      ).map((issue) => issue.path),
    ).toEqual([
      "storefront.figentra.cloud",
      "storefront.figentra.cloud.campaigns.spring-drop.host",
      "storefront.figentra.cloud.campaigns.quiet.host",
    ]);
  });
});
