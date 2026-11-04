/**
 * Stackra file contract:
 * Purpose: `ZonePolicy`, the zone preset a root runway's `providers.cloudflare.zones.<zone>.policy` names: `baseline`
 *          (SSL Full strict, TLS 1.3, HSTS, Automatic HTTPS Rewrites, DNSSEC, CAA) and `strict` (the baseline plus bot
 *          protection, which needs the Pro plan).
 * Boundary: an `Enum.of` value plus the type of the same name. The codes are the runway schema's.
 * Runtime: isomorphic
 * Governing contract: ADR 0519 (decisions 5 and 6), ADR 0175, ADR 0231; STA-1993.
 */
import { Enum } from "@stackra/contracts";

/** One case per zone preset. */
export const ZonePolicy = Enum.of({
  /** SSL Full (strict), TLS 1.3, HSTS, Automatic HTTPS Rewrites, DNSSEC and CAA for Cloudflare's CAs. */
  Baseline: "baseline",
  /** The baseline plus Super Bot Fight Mode; needs the Pro plan. */
  Strict: "strict",
});

/** One of the codes above. */
export type ZonePolicy = Enum.Value<typeof ZonePolicy>;
