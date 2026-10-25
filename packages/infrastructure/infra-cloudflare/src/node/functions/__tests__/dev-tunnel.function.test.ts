/**
 * Stackra file contract:
 * Purpose: unit tests of `devTunnel`: a named tunnel with its config held by Cloudflare, the ingress rules of
 *          `tunnelIngress` in its remote config, and a proxied CNAME per dev host to the tunnel; the catch-all gets no
 *          record and no token is an output.
 * Boundary: test only; Pulumi under mocks, so no provider or cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0290 (decisions 2, 4 and 5).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { tunnelIngress } from "#core/functions/tunnel-ingress.function";
import { devTunnel } from "#node/functions/dev-tunnel.function";
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

describe("devTunnel", () => {
  it("declares the tunnel, its ingress and a CNAME per dev host", async () => {
    const ingress = tunnelIngress({
      label: "akouta",
      zone: "figentra.cloud",
      ports: { console: 5173, web: 5174 },
    });
    const tunnel = devTunnel({
      accountId: "acc-1",
      zoneId: "zone-dev",
      name: "figentra-akouta",
      ingress,
    });
    await settled(tunnel);

    expect(
      declaredAs(
        declared,
        "cloudflare:index/zeroTrustTunnelCloudflared:ZeroTrustTunnelCloudflared",
      )[0]?.inputs,
    ).toEqual({ accountId: "acc-1", name: "figentra-akouta", configSrc: "cloudflare" });
    expect(
      declaredAs(
        declared,
        "cloudflare:index/zeroTrustTunnelCloudflaredConfig:ZeroTrustTunnelCloudflaredConfig",
      )[0]?.inputs,
    ).toEqual({
      accountId: "acc-1",
      tunnelId: "tunnel-figentra-akouta-id",
      config: {
        ingresses: [
          { hostname: "console-akouta.figentra.cloud", service: "http://localhost:5173" },
          { hostname: "web-akouta.figentra.cloud", service: "http://localhost:5174" },
          { service: "http_status:404" },
        ],
      },
    });
    expect(inputsByName(declared, "cloudflare:index/dnsRecord:DnsRecord")).toEqual(
      Object.fromEntries(
        ["console-akouta.figentra.cloud", "web-akouta.figentra.cloud"].map((name) => [
          `tunnel-figentra-akouta-${name}`,
          {
            zoneId: "zone-dev",
            name,
            type: "CNAME",
            content: "tunnel-figentra-akouta-id.cfargotunnel.com",
            proxied: true,
            ttl: 1,
            comment: "Dev tunnel figentra-akouta (ADR 0290 decision 5)",
          },
        ]),
      ),
    );
    expect(Object.keys(tunnel)).toEqual(["tunnel", "config", "records"]);
  });
});
