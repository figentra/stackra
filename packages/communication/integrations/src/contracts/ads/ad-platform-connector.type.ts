/**
 * Stackra file contract:
 * Purpose: `AdPlatformConnector`, what an ad platform's Connection implements (Meta, TikTok, Snap, Google Ads): send
 *          server-side conversions, and add, remove or replace the members of a customer audience.
 * Boundary: an interface a Connection implements when its Integration declares `ConnectorKind.AdPlatform`. The
 *           platform's catalogue is a separate `ProductFeedConnector` on the same Connection. Conversions carry their
 *           pixel `eventId`, so a retried batch is counted once; `replace` sets the whole audience, so a retry is
 *           harmless too. Members are `MatchKeys`, hashed before they reach the Connection. Which pixel, ad account
 *           and audience a Connection uses are its settings.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decisions 1 and 5); ADR 0134 (personal data); COM-301; STA-793.
 */
import type { AdBatchResult } from "#contracts/ads/ad-batch-result.type";
import type { ConversionEvent } from "#contracts/ads/conversion-event.type";
import type { MatchKeys } from "#contracts/ads/match-keys.type";

/**
 * An ad platform account.
 *
 * @example
 * const result = await ads.sendConversions([purchase]);
 * await ads.syncAudience("vip-buyers", members, "replace");
 */
export interface AdPlatformConnector {
  /** Sends `events` to the conversions API. */
  sendConversions(events: readonly ConversionEvent[]): Promise<AdBatchResult>;

  /**
   * Changes the members of audience `audience` (the platform's audience id from the Connection's settings).
   *
   * @param mode - `add` and `remove` change only `members`; `replace` makes the audience exactly `members`.
   */
  syncAudience(
    audience: string,
    members: readonly MatchKeys[],
    mode: "add" | "remove" | "replace",
  ): Promise<AdBatchResult>;
}
