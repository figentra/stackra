/**
 * Stackra file contract:
 * Purpose: `MemoryAdPlatform`, the memory driver of the `AdPlatformConnector` contract: conversions kept once per
 *          `eventId` (as a platform deduplicates a pixel and a server event) and audiences held as sets of hashed
 *          members, so an ad export runs end to end in a test or a local host with no platform.
 * Boundary: a plain class implementing the contract, not a Connection: no credential and no provider call (vendor
 *           Connections are OS integrations connectors, ADR 0443 decision 7). A member with no key is refused by its
 *           index, as a platform refuses an empty row. Names no vendor.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (decision 2: a memory driver per capability); ADR 0269 (decision 3); STA-793.
 */
import type {
  AdBatchResult,
  AdPlatformConnector,
  ConversionEvent,
  MatchKeys,
} from "#contracts/index";

/** One member's identity in an audience: its keys, in a fixed order. */
const memberKey = (member: MatchKeys): string =>
  JSON.stringify([member.email ?? "", member.phone ?? "", member.externalId ?? ""]);

/**
 * An ad platform in memory.
 *
 * @example
 * const ads = new MemoryAdPlatform();
 * await ads.sendConversions([purchase]);
 * ads.audience("vip").size; // members
 */
export class MemoryAdPlatform implements AdPlatformConnector {
  /** Every conversion taken, oldest first, once per `eventId`. */
  readonly conversions: ConversionEvent[] = [];

  /** Audience id to its members. */
  private readonly audiences = new Map<string, Map<string, MatchKeys>>();

  /** Takes each event whose `eventId` it has not seen. */
  async sendConversions(events: readonly ConversionEvent[]): Promise<AdBatchResult> {
    for (const event of events)
      if (!this.conversions.some((seen) => seen.eventId === event.eventId))
        this.conversions.push(event);
    return { received: events.length, refused: [] };
  }

  /** Adds, removes or replaces the members of `audience`. */
  async syncAudience(
    audience: string,
    members: readonly MatchKeys[],
    mode: "add" | "remove" | "replace",
  ): Promise<AdBatchResult> {
    const refused = members.flatMap((member, index) =>
      Object.keys(member).length === 0 ? [{ ref: String(index), reason: "no match key" }] : [],
    );
    const valid = members.filter((member) => Object.keys(member).length > 0);
    const current = mode === "replace" ? new Map<string, MatchKeys>() : this.audience(audience);
    for (const member of valid)
      if (mode === "remove") current.delete(memberKey(member));
      else current.set(memberKey(member), member);
    this.audiences.set(audience, current);
    return { received: valid.length, refused };
  }

  /** The members of `audience`, by key; empty when it was never synced. */
  audience(audience: string): Map<string, MatchKeys> {
    return this.audiences.get(audience) ?? new Map();
  }
}
