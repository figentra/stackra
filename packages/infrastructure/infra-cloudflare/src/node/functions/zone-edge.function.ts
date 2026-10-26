/**
 * Stackra file contract:
 * Purpose: `zoneEdge(args)`, the runway edge on one zone: the TLS settings (minimum version, HTTPS only, HSTS when the
 *          runway asks), the plan's managed WAF ruleset, the coarse per-IP rate limit followed by any per-shopper
 *          limits of a storefront's hot items, the cache bypass on the API host and the bot protection.
 * Boundary: declares Pulumi resources only; the rules come from `parseEdge` and `rateLimitFor`. Each ruleset is the
 *           zone's entry point for its phase, so a zone whose phase entry point was made by hand imports it first.
 *           Per-area and per-plan application limits are the service pipeline's (ADR 0217 decision 2).
 * Runtime: node
 * Governing contract: ADR 0175 (decision 1), ADR 0217 (decisions 2 and 3), ADR 0237 (layer 1), ADR 0290 (decision 13),
 *                     ADR 0325 (rule 24: a Cloudflare Cache Rule bypasses the cache on API hosts), ADR 0402 (per-shopper
 *                     limits share the zone's rate-limit entry point).
 */
import * as cloudflare from "@pulumi/cloudflare";
import type * as pulumi from "@pulumi/pulumi";

import { MANAGED_RULESET_IDS } from "#core/constants/managed-ruleset-ids.constant";
import { BotMode } from "#core/enums/bot-mode.enum";
import { WafMode } from "#core/enums/waf-mode.enum";
import { ZonePlan } from "#core/enums/zone-plan.enum";
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
}) {
  const { name, zoneId, plan, edge, shopperRules = [] } = args;
  const setting = (id: string, value: unknown) =>
    new cloudflare.ZoneSetting(`${name}-${id.replaceAll("_", "-")}`, {
      zoneId,
      settingId: id,
      value,
    });
  const settings = [
    setting("min_tls_version", edge.tls.minVersion),
    setting("always_use_https", "on"),
    ...(edge.tls.hsts ? [setting("security_header", HSTS)] : []),
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
    edge.bots.mode === BotMode.Off
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
  return { settings, rulesets, bots };
}
