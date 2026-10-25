/**
 * Stackra file contract:
 * Purpose: `BotMode`, the root runway's `edge.bots.mode`: how the edge treats automated traffic.
 * Boundary: an `Enum.of` value plus the type of the same name; the Cloudflare setting each plan maps it to is
 *           `zoneEdge`'s (Bot Fight Mode on Free, Super Bot Fight Mode on Pro).
 * Runtime: isomorphic
 * Governing contract: ADR 0175 (decision 1: Cloudflare proxies every public hostname), ADR 0038 (decision 1, carried
 *                     forward by ADR 0217), ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/** One case per bot mode; the codes are the runway's. */
export const BotMode = Enum.of({
  /** The program leaves the zone's bot settings alone. */
  Off: "off",
  /** Likely and definitely automated requests get a managed challenge; verified bots pass. */
  LikelyAutomatedChallenge: "likely-automated-challenge",
});

/** One of the codes above. */
export type BotMode = Enum.Value<typeof BotMode>;
