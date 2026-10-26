/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the edge and stack checks, the tunnel and rate-limit planners, the
 *          dev-port reader, the enums and the error are exported, nothing else is (the zod schemas and ruleset ids
 *          stay internal, the Pulumi programs are `./node`'s), and the public types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as infraCloudflare from "#core/index";
import type { CloudflareStack, EdgePolicy, TunnelIngressRule, ZoneOptions } from "#core/index";

describe("@stackra/infra-cloudflare", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(infraCloudflare).sort()).toEqual([
      "BotMode",
      "CloudflareConfigInvalidError",
      "CloudflareHealthIndicatorDriver",
      "WafMode",
      "ZonePlan",
      "devPortsOf",
      "parseCloudflareStack",
      "parseEdge",
      "parseStorefront",
      "rateLimitFor",
      "shopperLimitRules",
      "tunnelIngress",
    ]);
  });

  it("exports the types", () => {
    expectTypeOf<EdgePolicy["proxy"]>().toEqualTypeOf<"all" | "none">();
    expectTypeOf<CloudflareStack["zones"][string]>().toEqualTypeOf<ZoneOptions>();
    expectTypeOf<TunnelIngressRule["service"]>().toEqualTypeOf<string>();
  });
});
