/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the edge and stack checks, the tunnel, rate-limit and Workers cache namespace planners, the
 *          dev-port reader, the login directory handler and KV calls, the enums and the error are exported, nothing else is (the zod schemas and ruleset ids
 *          stay internal, the Pulumi programs are `./node`'s), and the public types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as infraCloudflare from "#core/index";
import type {
  CloudflareApiRequest,
  CloudflareStack,
  EdgePolicy,
  EdgeWorker,
  LoginDirectoryKv,
  LoginDirectoryOptions,
  SigningKeySlot,
  TunnelIngressRule,
  ZoneOptions,
} from "#core/index";

describe("@stackra/infra-cloudflare", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(infraCloudflare).sort()).toEqual([
      "BotMode",
      "CloudflareConfigInvalidError",
      "CloudflareHealthIndicatorDriver",
      "CustomHostnameState",
      "InfraCloudflareConfig",
      "InfraCloudflareConfig$",
      "OriginLock",
      "WafMode",
      "ZonePlan",
      "customHostnameRequest",
      "customHostnameState",
      "devPortsOf",
      "edgeKvKey",
      "loginDirectoryHandler",
      "loginDirectoryKvRequest",
      "parseCloudflareStack",
      "parseEdge",
      "parseStorefront",
      "rateLimitFor",
      "regionalHostnameRequest",
      "shopperLimitRules",
      "signingKeySlots",
      "tunnelIngress",
      "workersCacheNamespaces",
    ]);
  });

  it("exports the types", () => {
    expectTypeOf<EdgePolicy["proxy"]>().toEqualTypeOf<"all" | "none">();
    expectTypeOf<CloudflareStack["zones"][string]>().toEqualTypeOf<ZoneOptions>();
    expectTypeOf<TunnelIngressRule["service"]>().toEqualTypeOf<string>();
    expectTypeOf<NonNullable<CloudflareStack["edgeWorker"]>>().toEqualTypeOf<EdgeWorker>();
    expectTypeOf<SigningKeySlot["signs"]>().toEqualTypeOf<boolean>();
    expectTypeOf<LoginDirectoryOptions["kv"]>().toEqualTypeOf<LoginDirectoryKv>();
    expectTypeOf<CloudflareApiRequest["method"]>().toEqualTypeOf<
      "GET" | "POST" | "PATCH" | "DELETE"
    >();
  });
});
