/**
 * Stackra file contract:
 * Purpose: `ZONE_OPTIONS_SCHEMA`, what the core stack config says about one zone of the root runway: its plan, whether
 *          the runway edge applies, the Cloudflare for SaaS fallback origin, its DNS records (keyed by a stable name,
 *          each with an optional import id), its Worker custom domains and the hosts kept in one region by
 *          Cloudflare's regional services (data localisation for regulated markets).
 * Boundary: internal; the stack schema composes it, and `cloudflareCoreStack` parses `{}` through it for a runway zone
 *           the stack config does not list. Record content is public DNS data, never a secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (decision 6: zones and DNS in the core stack), ADR 0290 (decisions 3, 13, 15 and 19),
 *                     ADR 0284 (decision 9: the core stack adopts the static Worker's domain), ADR 0276 (decision 4),
 *                     ADR 0437 (decision 12: regulated markets), ADR 0353 (data residency).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { DNS_LABEL_SCHEMA } from "#core/constants/dns-label-schema.constant";
import { HOSTNAME_SCHEMA } from "#core/constants/hostname-schema.constant";
import { ZonePlan } from "#core/enums/zone-plan.enum";

/** One label of a record name: `_` is allowed (`resend._domainkey`), `*` only as the whole first label. */
const RECORD_LABEL = "[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?";

/** One DNS record, named relative to its zone (`@` is the apex). */
const RECORD = z.strictObject({
  type: z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "CAA", "SRV", "NS"]),
  name: z
    .string()
    .regex(
      new RegExp(`^(?:@|(?:\\*|${RECORD_LABEL})(?:\\.${RECORD_LABEL})*)$`),
      "Expected a name relative to the zone, or @ for the apex",
    ),
  content: z.string().min(1),
  /** Defaults to the edge `proxy` rule for A, AAAA and CNAME records; other types are never proxied. */
  proxied: z.boolean().optional(),
  /** Seconds; 1 is automatic, and a proxied record is always automatic. */
  ttl: z.int().min(1).default(1),
  priority: z.int().min(0).optional(),
  comment: z.string().optional(),
  /** The Cloudflare record id of a hand-made record the stack adopts (ADR 0290 decision 15). */
  import: z.string().min(1).optional(),
});

/** One zone's options, defaults applied. */
export const ZONE_OPTIONS_SCHEMA = z.strictObject({
  plan: z.enum(Enum.values(ZonePlan) as [ZonePlan, ...ZonePlan[]]).default(ZonePlan.Free),
  /** Whether the runway `edge` (WAF, bots, rate limit, API cache bypass) applies; TLS settings apply to every zone. */
  edge: z.boolean().default(true),
  /** The Cloudflare for SaaS fallback origin tenant hostnames point at, under this zone (ADR 0290 decision 3). */
  fallbackOrigin: HOSTNAME_SCHEMA.optional(),
  records: z.record(DNS_LABEL_SCHEMA, RECORD).default({}),
  /** Hostname under this zone → the Worker that serves it as a custom domain. */
  workers: z
    .record(
      HOSTNAME_SCHEMA,
      z.strictObject({
        service: z.string().min(1),
        /** The Cloudflare id of a custom domain made before the stack (ADR 0284 decision 9). */
        import: z.string().min(1).optional(),
      }),
    )
    .default({}),
  /**
   * Hostname under this zone → the Cloudflare regional-services region key (such as `eu`) whose points of presence
   * alone terminate its TLS. An option for a regulated market's hosts; which market needs it is the market pack's
   * launch-gate answer (ADR 0437 decision 12), never a default here.
   */
  regional: z.record(HOSTNAME_SCHEMA, z.string().min(1)).default({}),
});
