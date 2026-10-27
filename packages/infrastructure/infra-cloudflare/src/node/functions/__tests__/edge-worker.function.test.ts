/**
 * Stackra file contract:
 * Purpose: unit tests of `edgeWorker`: one KV namespace per label (a jurisdiction kept), the routes on their zones,
 *          the gradual deployment as percentage shares, a tunnel origin with its remote ingress and CNAME, an mTLS
 *          origin turning on authenticated origin pulls once per zone, every origin behind an Access application
 *          that admits only the Worker's service token, and the signing-key slots; nothing optional is declared when
 *          the config leaves it out.
 * Boundary: test only; Pulumi under mocks, so no provider or cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0437 (decisions 4, 5, 6 and 9).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { EDGE_WORKER_SCHEMA } from "#core/constants/edge-worker-schema.constant";
import { edgeWorker } from "#node/functions/edge-worker.function";
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

const zoneIds = { "figentra.com": "zone-com", "eu.figentra.com": "zone-eu" };

describe("edgeWorker", () => {
  it("declares the KV, routes, rollout and locked origins", async () => {
    const worker = EDGE_WORKER_SCHEMA.parse({
      script: "figentra-edge",
      namespaces: { edge: {}, "edge-eu": { jurisdiction: "eu" } },
      routes: { "figentra.com": ["*.shop.figentra.com/*", "console.mezzora.figentra.com/*"] },
      rollout: [
        { version: "v-new", percent: 10 },
        { version: "v-old", percent: 90 },
      ],
      origins: {
        "me-central": {
          hostname: "api-me-central.figentra.com",
          lock: "tunnel",
          service: "http://localhost:4000",
        },
        eu: { hostname: "api.eu.figentra.com", lock: "mtls" },
        "eu-2": { hostname: "api-2.eu.figentra.com", lock: "mtls" },
      },
      signingKeys: ["k2026-10", "k2026-07"],
    });
    const edge = edgeWorker({ accountId: "acc-1", project: "figentra", zoneIds, worker });
    await settled(edge);

    expect(
      inputsByName(declared, "cloudflare:index/workersKvNamespace:WorkersKvNamespace"),
    ).toEqual({
      "figentra-edge-kv-edge": { accountId: "acc-1", title: "figentra-edge-edge" },
      "figentra-edge-kv-edge-eu": {
        accountId: "acc-1",
        title: "figentra-edge-edge-eu",
        jurisdiction: "eu",
      },
    });
    expect(declaredAs(declared, "cloudflare:index/workersRoute:WorkersRoute")).toHaveLength(2);
    expect(
      declaredAs(declared, "cloudflare:index/workersDeployment:WorkersDeployment")[0]?.inputs,
    ).toEqual({
      accountId: "acc-1",
      scriptName: "figentra-edge",
      strategy: "percentage",
      versions: [
        { versionId: "v-new", percentage: 10 },
        { versionId: "v-old", percentage: 90 },
      ],
    });
    expect(
      declaredAs(
        declared,
        "cloudflare:index/zeroTrustTunnelCloudflaredConfig:ZeroTrustTunnelCloudflaredConfig",
      )[0]?.inputs["config"],
    ).toEqual({
      ingresses: [
        { hostname: "api-me-central.figentra.com", service: "http://localhost:4000" },
        { service: "http_status:404" },
      ],
    });
    expect(
      inputsByName(declared, "cloudflare:index/dnsRecord:DnsRecord")[
        "tunnel-figentra-origin-me-central-api-me-central.figentra.com"
      ]?.["zoneId"],
    ).toBe("zone-com");
    expect(
      inputsByName(
        declared,
        "cloudflare:index/authenticatedOriginPullsSettings:AuthenticatedOriginPullsSettings",
      ),
    ).toEqual({ "eu.figentra.com-origin-pulls": { zoneId: "zone-eu", enabled: true } });
    expect(
      inputsByName(declared, "cloudflare:index/zeroTrustAccessPolicy:ZeroTrustAccessPolicy")[
        "figentra-edge-origin-policy"
      ],
    ).toMatchObject({
      decision: "non_identity",
      includes: [{ serviceToken: { tokenId: "figentra-edge-origin-token-id" } }],
    });
    expect(
      Object.keys(
        inputsByName(
          declared,
          "cloudflare:index/zeroTrustAccessApplication:ZeroTrustAccessApplication",
        ),
      ).sort(),
    ).toEqual([
      "figentra-edge-origin-eu",
      "figentra-edge-origin-eu-2",
      "figentra-edge-origin-me-central",
    ]);
    expect(edge.signingKeys.map((slot) => [slot.secret, slot.signs])).toEqual([
      ["STACKRA_EDGE_SIGNING_KEY_K2026_10", true],
      ["STACKRA_EDGE_SIGNING_KEY_K2026_07", false],
    ]);
  });

  it("declares only the default namespace when the rest is left out", async () => {
    const edge = edgeWorker({
      accountId: "acc-1",
      project: "figentra",
      zoneIds,
      worker: EDGE_WORKER_SCHEMA.parse({ script: "figentra-edge", signingKeys: ["k1"] }),
    });
    await settled(edge);

    expect(edge.deployment).toBeUndefined();
    expect(edge.originToken).toBeUndefined();
    expect(declared.map((resource) => resource.type)).toEqual([
      "cloudflare:index/workersKvNamespace:WorkersKvNamespace",
    ]);
  });
});
