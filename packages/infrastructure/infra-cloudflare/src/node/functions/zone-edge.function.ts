/**
 * Stackra file contract:
 * Purpose: `zoneEdge(args)`, the runway edge on one zone: the TLS settings (minimum version, HTTPS only, HSTS when the
 *          runway asks), the plan's managed WAF ruleset, the coarse per-IP rate limit followed by any per-shopper
 *          limits of a storefront's hot items, the cache bypass on the API host and the bot protection.
 * Boundary: declares Pulumi resources only; the rules come from `parseEdge` and `rateLimitFor`. Each ruleset is the
 *           zone's entry point for its phase, so a zone whose phase entry point was made by hand imports it first.
 *           Per-area and per-plan application limits are the service pipeline's (ADR 0217 decision 2).
 * Runtime: node
 *
 *          With a zone `policy` (ADR 0519 decision 6) it also sets SSL Full (strict), TLS 1.3 and Automatic HTTPS
 *          Rewrites, forces HSTS, turns DNSSEC on and adds CAA records for Cloudflare's CAs; `strict` also turns the
 *          bot protection on and is refused on the Free plan. The DS record at the registrar is the owner's.
 * Governing contract: ADR 0519 (decisions 5 and 6), ADR 0175 (decision 1), ADR 0217 (decisions 2 and 3), ADR 0237 (layer 1), ADR 0290 (decision 13),
 *                     ADR 0325 (rule 24: a Cloudflare Cache Rule bypasses the cache on API hosts), ADR 0402 (per-shopper
 *                     limits share the zone's rate-limit entry point).
 */
import * as cloudflare from "@pulumi/cloudflare";
import type * as pulumi from "@pulumi/pulumi";

import { MANAGED_RULESET_IDS } from "#core/constants/managed-ruleset-ids.constant";
import { BotMode } from "#core/enums/bot-mode.enum";
import { WafMode } from "#core/enums/waf-mode.enum";
import { ZonePlan } from "#core/enums/zone-plan.enum";
import { ZonePolicy } from "#core/enums/zone-policy.enum";
import { rateLimitFor } from "#core/functions/rate-limit-for.function";
import type { EdgePolicy } from "#core/types/edge-policy.type";
import type { ShopperLimitRule } from "#core/types/shopper-limit-rule.type";

/**
 * HSTS for one year, without subdomains or preload: both outlive a mistake and are a deliberate owner change. The
 * setting's value is untyped and reaches Cloudflare as written, so it keeps the API's own snake_case keys.
 */
const HSTS = {
  strict_transport_security: {
    enabled: true,
    max_age: 31_536_000,
    include_subdomains: false,
    preload: false,
    nosniff: true,
  },
};

/** The CAs Cloudflare issues Universal SSL from; CAA names exactly these (ADR 0519 decision 6). */
const CAS = ["digicert.com", "letsencrypt.org", "pki.goog", "ssl.com", "sectigo.com"];

/**
 * The edge resources of the zone `name`.
 *
 * @param args - the zone name and id, its plan, the parsed edge policy and a storefront's per-shopper rules
 *               (`storefrontEdge(...).rules`), which share the zone's one rate-limit entry point.
 * @example
 * zoneEdge({ name: "figentra.com", zoneId: zone.id, plan: "free", edge: parseEdge(root) });
 */
export function zoneEdge(args: {
  readonly name: string;
  readonly zoneId: pulumi.Input<string>;
  readonly plan: ZonePlan;
  readonly edge: EdgePolicy;
  readonly shopperRules?: readonly ShopperLimitRule[] | undefined;
  /** The zone preset of the owning root runway; without it the zone keeps the edge's own settings only. */
  readonly policy?: ZonePolicy | undefined;
}): {
  settings: cloudflare.ZoneSetting[];
  rulesets: cloudflare.Ruleset[];
  bots: cloudflare.BotManagement | undefined;
  dnssec: cloudflare.ZoneDnssec | undefined;
  caa: cloudflare.DnsRecord[];
} {
  const { name, zoneId, plan, edge, shopperRules = [], policy } = args;
  if (policy === ZonePolicy.Strict && plan === ZonePlan.Free)
    throw new Error(`${name}: the strict zone policy needs the Pro plan (ADR 0519 decision 5)`);
  const setting = (id: string, value: unknown) =>
    new cloudflare.ZoneSetting(`${name}-${id.replaceAll("_", "-")}`, {
      zoneId,
      settingId: id,
      value,
    });
  const settings = [
    setting("min_tls_version", edge.tls.minVersion),
    setting("always_use_https", "on"),
    ...(edge.tls.hsts || policy !== undefined ? [setting("security_header", HSTS)] : []),
    ...(policy === undefined
      ? []
      : [
          setting("ssl", "strict"),
          setting("tls_1_3", "on"),
          setting("automatic_https_rewrites", "on"),
        ]),
  ];

  const rulesets: cloudflare.Ruleset[] = [];
  const ruleset = (id: string, phase: string, ...rules: cloudflare.types.input.RulesetRule[]) =>
    rulesets.push(
      new cloudflare.Ruleset(`${name}-${id}`, {
        zoneId,
        kind: "zone",
        name: `${name} ${id}`,
        phase,
        rules: rules.map((rule) => ({ enabled: true, ...rule })),
      }),
    );
  if (edge.waf === WafMode.Managed)
    ruleset("waf", "http_request_firewall_managed", {
      action: "execute",
      actionParameters: { id: MANAGED_RULESET_IDS[plan] },
      expression: "true",
      description: `Cloudflare managed rules for the ${plan} plan (ADR 0217 decision 3)`,
    });
  const limit = rateLimitFor(edge, plan);
  const limits: cloudflare.types.input.RulesetRule[] = [
    ...(limit === null
      ? []
      : [
          {
            action: "block",
            expression: "true",
            description:
              "Coarse per-IP limit; per-area limits are the service pipeline's (ADR 0217)",
            ratelimit: {
              characteristics: ["ip.src", "cf.colo.id"],
              period: limit.period,
              requestsPerPeriod: limit.requestsPerPeriod,
              mitigationTimeout: limit.period,
            },
          },
        ]),
    ...shopperRules.map((rule) => ({ ...rule, ratelimit: { ...rule.ratelimit } })),
  ];
  if (limits.length > 0) ruleset("rate-limit", "http_ratelimit", ...limits);
  if (edge.apiHost !== undefined)
    ruleset("cache-bypass", "http_request_cache_settings", {
      action: "set_cache_settings",
      actionParameters: { cache: false },
      expression: `(http.host eq "${edge.apiHost}.${name}")`,
      description: "No API response is cached at the edge (ADR 0325 rule 24)",
    });

  const bots =
    edge.bots.mode === BotMode.Off && policy !== ZonePolicy.Strict
      ? undefined
      : new cloudflare.BotManagement(
          `${name}-bots`,
          plan === ZonePlan.Free
            ? { zoneId, fightMode: true }
            : {
                zoneId,
                sbfmLikelyAutomated: "managed_challenge",
                sbfmDefinitelyAutomated: "managed_challenge",
                sbfmVerifiedBots: "allow",
              },
        );
  const dnssec =
    policy === undefined ? undefined : new cloudflare.ZoneDnssec(`${name}-dnssec`, { zoneId });
  const caa =
    policy === undefined
      ? []
      : CAS.map(
          (ca) =>
            new cloudflare.DnsRecord(`${name}-caa-${ca.replaceAll(".", "-")}`, {
              zoneId,
              name,
              type: "CAA",
              ttl: 1,
              data: { flags: 0, tag: "issue", value: ca },
            }),
        );
  return { settings, rulesets, bots, dnssec, caa };
}
