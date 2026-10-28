/**
 * Stackra file contract:
 * Purpose: `parseAnalyticsIdentity(value)`, how an identity driver turns what it read (a decoded cookie, a storage
 *          value) into an `AnalyticsIdentityRecord`, or `null` when it is not one.
 * Boundary: internal; never throws, so an edited or stale value reads as no identity (a new anonymous id is made after
 *           consent) instead of breaking the page. Accepts a JSON string or an already parsed value.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decision 5); ADR 0095 as amended (Zod at the boundary).
 */
import type { AnalyticsIdentityRecord } from "#contracts/types/analytics-identity-record.type";
import { ANALYTICS_IDENTITY_SCHEMA } from "#core/constants/analytics-identity-schema.constant";

/**
 * The identity in `value`, or `null`.
 *
 * @param value - JSON text, or a value already parsed from JSON.
 * @example
 * parseAnalyticsIdentity('{"anonymousId":"anon_01jb9x3k7m2c8q4w6e5r0t1y2z"}');
 */
export function parseAnalyticsIdentity(value: unknown): AnalyticsIdentityRecord | null {
  let candidate = value;
  if (typeof value === "string") {
    try {
      candidate = JSON.parse(value);
    } catch {
      return null;
    }
  }
  const result = ANALYTICS_IDENTITY_SCHEMA.safeParse(candidate);
  if (!result.success) return null;
  const { anonymousId, userId, groups } = result.data;
  return Object.freeze({
    anonymousId,
    ...(userId === undefined ? {} : { userId }),
    ...(groups === undefined ? {} : { groups: Object.freeze({ ...groups }) }),
  });
}
