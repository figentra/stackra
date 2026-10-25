/**
 * Stackra file contract:
 * Purpose: unit tests of `zoneEdge`: the template edge on a Free zone gives the TLS settings with HSTS, the Free
 *          Managed Ruleset, a 10-second per-IP limit, the API cache bypass and Bot Fight Mode; on Pro the Cloudflare
 *          Managed Ruleset, the one-minute limit and Super Bot Fight Mode; the defaults give the TLS settings and the
 *          WAF only; `waf: off` deploys no managed ruleset.
 * Boundary: test only; Pulumi under mocks, so no provider or cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0217 (decisions 2 and 3), ADR 0290 (decision 13), ADR 0325
 *                     (rule 24).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { rootRunway, TEMPLATE_EDGE } from "#core/__tests__/fixtures/root-runway.fixture";
import { parseEdge } from "#core/functions/parse-edge.function";
import { zoneEdge } from "#node/functions/zone-edge.function";
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

const template = parseEdge(rootRunway({ edge: TEMPLATE_EDGE }));

/** The declared inputs of each ruleset, keyed by resource name. */
const rulesets = () => inputsByName(declared, "cloudflare:index/ruleset:Ruleset");

describe("zoneEdge", () => {
  it("applies the template edge on a Free zone", async () => {
    await settled(
      zoneEdge({ name: "figentra.com", zoneId: "zone-1", plan: "free", edge: template }),
    );

    expect(inputsByName(declared, "cloudflare:index/zoneSetting:ZoneSetting")).toEqual({
      "figentra.com-min-tls-version": {
        zoneId: "zone-1",
        settingId: "min_tls_version",
        value: "1.2",
      },
      "figentra.com-always-use-https": {
        zoneId: "zone-1",
        settingId: "always_use_https",
        value: "on",
      },
      "figentra.com-security-header": {
        zoneId: "zone-1",
        settingId: "security_header",
        value: {
          strict_transport_security: {
            enabled: true,
            max_age: 31_536_000,
            include_subdomains: false,
            preload: false,
            nosniff: true,
          },
        },
      },
    });
    expect(rulesets()).toEqual({
      "figentra.com-waf": {
        zoneId: "zone-1",
        kind: "zone",
        name: "figentra.com waf",
        phase: "http_request_firewall_managed",
        rules: [
          {
            enabled: true,
            action: "execute",
            actionParameters: { id: "77454fe2d30c4220b5701f6fdfb893ba" },
            expression: "true",
            description: "Cloudflare managed rules for the free plan (ADR 0217 decision 3)",
          },
        ],
      },
      "figentra.com-rate-limit": {
        zoneId: "zone-1",
        kind: "zone",
        name: "figentra.com rate-limit",
        phase: "http_ratelimit",
        rules: [
          {
            enabled: true,
            action: "block",
            expression: "true",
            description:
              "Coarse per-IP limit; per-area limits are the service pipeline's (ADR 0217)",
            ratelimit: {
              characteristics: ["ip.src", "cf.colo.id"],
              period: 10,
              requestsPerPeriod: 100,
              mitigationTimeout: 10,
            },
          },
        ],
      },
      "figentra.com-cache-bypass": {
        zoneId: "zone-1",
        kind: "zone",
        name: "figentra.com cache-bypass",
        phase: "http_request_cache_settings",
        rules: [
          {
            enabled: true,
            action: "set_cache_settings",
            actionParameters: { cache: false },
            expression: '(http.host eq "api.figentra.com")',
            description: "No API response is cached at the edge (ADR 0325 rule 24)",
          },
        ],
      },
    });
    expect(declaredAs(declared, "cloudflare:index/botManagement:BotManagement")[0]?.inputs).toEqual(
      {
        zoneId: "zone-1",
        fightMode: true,
      },
    );
  });

  it("uses the Pro ruleset, window and Super Bot Fight Mode on a Pro zone", async () => {
    await settled(
      zoneEdge({ name: "figentra.com", zoneId: "zone-1", plan: "pro", edge: template }),
    );

    const current = rulesets();
    expect(current["figentra.com-waf"]).toMatchObject({
      rules: [{ actionParameters: { id: "efb7b8c949ac4650a09736fc376e9aee" } }],
    });
    expect(current["figentra.com-rate-limit"]).toMatchObject({
      rules: [{ ratelimit: { period: 60, requestsPerPeriod: 600, mitigationTimeout: 60 } }],
    });
    expect(declaredAs(declared, "cloudflare:index/botManagement:BotManagement")[0]?.inputs).toEqual(
      {
        zoneId: "zone-1",
        sbfmLikelyAutomated: "managed_challenge",
        sbfmDefinitelyAutomated: "managed_challenge",
        sbfmVerifiedBots: "allow",
      },
    );
  });

  it("gives the TLS settings and the WAF only under the defaults, and no WAF when it is off", async () => {
    const defaults = zoneEdge({
      name: "acme.example",
      zoneId: "zone-2",
      plan: "free",
      edge: parseEdge(rootRunway()),
    });
    await settled(defaults);

    expect(defaults.settings).toHaveLength(2);
    expect(Object.keys(rulesets())).toEqual(["acme.example-waf"]);
    expect(defaults.bots).toBeUndefined();

    const off = zoneEdge({
      name: "acme.test",
      zoneId: "zone-3",
      plan: "free",
      edge: parseEdge(rootRunway({ edge: { waf: "off" } })),
    });
    await settled(off);
    expect(off.rulesets).toEqual([]);
  });
});
