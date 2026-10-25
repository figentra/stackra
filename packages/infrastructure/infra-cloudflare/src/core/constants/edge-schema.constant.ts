/**
 * Stackra file contract:
 * Purpose: `EDGE_SCHEMA`, the root runway's `edge` block as this package reads it: the proxy rule, the managed WAF,
 *          the bot mode, the coarse per-IP rate limit, TLS (minimum version, HSTS) and the API host label, with the
 *          defaults the ADRs set.
 * Boundary: internal; `parseEdge` reads it. The runway schema leaves `edge` open for its owners to check, so keys
 *           another owner reads (`analyticsProxy`) pass through untouched. Per-area application limits are the
 *           service's `rate-limit.config.ts`, never this block.
 * Runtime: isomorphic
 * Governing contract: ADR 0175 (decision 1: proxy every public hostname), ADR 0217 (decisions 2 and 3: edge rate limits
 *                     and the WAF), ADR 0237 (layer 1: the edge), ADR 0325 (rule 24: no cache on API hosts).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { DNS_LABEL_SCHEMA } from "#core/constants/dns-label-schema.constant";
import { BotMode } from "#core/enums/bot-mode.enum";
import { WafMode } from "#core/enums/waf-mode.enum";

/** The edge block, defaults applied. */
export const EDGE_SCHEMA = z.looseObject({
  /** `all`: every A, AAAA and CNAME record is proxied unless it opts out (ADR 0175 decision 1). */
  proxy: z.enum(["all", "none"]).default("all"),
  waf: z.enum(Enum.values(WafMode) as [WafMode, ...WafMode[]]).default(WafMode.Managed),
  bots: z
    .strictObject({
      mode: z.enum(Enum.values(BotMode) as [BotMode, ...BotMode[]]).default(BotMode.Off),
    })
    .prefault({}),
  rateLimit: z
    .strictObject({
      perIp: z
        .strictObject({
          requests: z.int().min(1),
          periodSeconds: z.int().min(1),
        })
        .optional(),
    })
    .prefault({}),
  tls: z
    .strictObject({
      minVersion: z.enum(["1.0", "1.1", "1.2", "1.3"]).default("1.2"),
      hsts: z.boolean().default(false),
    })
    .prefault({}),
  /** The label of the API host on each edge zone (`api` gives `api.<zone>`), whose responses are never cached. */
  apiHost: DNS_LABEL_SCHEMA.optional(),
});
